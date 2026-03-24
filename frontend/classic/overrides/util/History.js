/* ****************************************************************************
 * Override: Ext.util.History - use replaceState for initial hash
 *
 * When setting the default token on app launch (no hash in URL), use
 * history.replaceState instead of location.hash assignment. This avoids
 * Firefox warning: "A session history item was added by this document without
 * any interaction from the user" (which causes back/forward to be skipped).
 * ****************************************************************************/
Ext.define('overrides.util.History', {
    override: 'Ext.util.History',

    setHash: function(hash) {
        var me = this,
            win = me.win,
            currentHash = me.getHash();

        try {
            // On initial load (empty hash, single history entry), use replaceState
            // to avoid adding a history entry without user interaction.
            if (currentHash === '' && win.history.length === 1 &&
                'replaceState' in win.history) {
                win.history.replaceState(null, '', '#' + hash);
                me.hash = hash;
                me.handleStateChange(hash);
            } else {
                win.location.hash = hash;
                me.currentToken = hash;
            }
        } catch (e) {
            // IE can give Access Denied (esp. in popup windows)
        }
    }
});
