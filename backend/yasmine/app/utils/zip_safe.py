# Safe ZIP extraction: reject traversal and cap uncompressed size.

import os
import shutil

MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024
COPY_CHUNK = 64 * 1024


class UnsafeZipError(ValueError):
    pass


def _is_within_directory(directory, target):
    directory = os.path.realpath(directory)
    target = os.path.realpath(target)
    return target == directory or target.startswith(directory + os.sep)


def safe_extractall(zip_file, dest_dir, max_bytes=MAX_UNCOMPRESSED_BYTES):
    dest_dir = os.path.realpath(dest_dir)
    os.makedirs(dest_dir, exist_ok=True)
    total = 0
    for info in zip_file.infolist():
        name = info.filename.replace('\\', '/')
        if name.startswith('/') or name.startswith('../') or '/../' in name or name == '..':
            raise UnsafeZipError('Unsafe zip path: %s' % info.filename)
        target = os.path.realpath(os.path.join(dest_dir, name))
        if not _is_within_directory(dest_dir, target):
            raise UnsafeZipError('Zip slip: %s' % info.filename)
        if name.endswith('/') or (hasattr(info, 'is_dir') and info.is_dir()):
            os.makedirs(target, exist_ok=True)
            continue
        os.makedirs(os.path.dirname(target), exist_ok=True)
        remaining = max_bytes - total
        written = 0
        with zip_file.open(info) as source, open(target, 'wb') as dest:
            while True:
                chunk = source.read(COPY_CHUNK)
                if not chunk:
                    break
                written += len(chunk)
                if written > remaining:
                    dest.close()
                    os.remove(target)
                    raise UnsafeZipError('Zip uncompressed size exceeds limit')
                dest.write(chunk)
        total += written
    return dest_dir
