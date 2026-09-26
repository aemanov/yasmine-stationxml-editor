# 2026-09-24, version 4.3.3-beta: ASGSR, Alexey Emanov
# ****************************************************************************
#
# Import an external RESP file into a channel Response attribute.
#
# ****************************************************************************

import io

from yasmine.app.enums.xml_node import XmlNodeAttrEnum
from yasmine.app.helpers.nrl.nrl_helper import response_from_resp
from yasmine.app.models.inventory import XmlNodeAttrModel, XmlNodeAttrValModel, XmlNodeInstModel
from yasmine.app.services.xml_service import XmlService
from yasmine.app.utils.db import db_transaction
from yasmine.app.utils.response_plot import polynomial_or_polezero_response
from yasmine.app.utils.response_sensitivity import response_obj_to_tree_json


def import_resp_into_channel(owner, node_inst_id, resp_bytes):
    """Store the first RESP channel response on the channel and return its tree.

    ``owner`` is a handler or mixin with a ``db`` session.
    """
    response = response_from_resp(io.BytesIO(resp_bytes))
    try:
        node_id = int(node_inst_id)
    except (TypeError, ValueError):
        raise ValueError('nodeInstanceId is required')
    node = owner.db.get(XmlNodeInstModel, node_id)
    if node is None:
        raise ValueError('Channel not found')

    with db_transaction(owner.db):
        response_attr = owner.db.query(XmlNodeAttrValModel).join(
            XmlNodeAttrValModel.attr
        ).filter(
            XmlNodeAttrValModel.node_inst_id == node.id,
            XmlNodeAttrModel.name == XmlNodeAttrEnum.RESPONSE,
        ).first()
        if response_attr is None:
            attr = owner.db.query(XmlNodeAttrModel).filter(
                XmlNodeAttrModel.name == XmlNodeAttrEnum.RESPONSE
            ).one()
            response_attr = XmlNodeAttrValModel(
                node_inst_id=node.id,
                attr_id=attr.id,
                attr=attr,
            )
            owner.db.add(response_attr)
        response_attr.value_obj = response
        if node.xml_id:
            XmlService(owner).update_timestamp(node.xml_id)

    return {
        'response': response,
        'data': response_obj_to_tree_json(response, node.id, owner),
        'text': polynomial_or_polezero_response(response),
    }
