import os

def data_path(filename):
    data_dir = os.environ.get("DATA_DIR")
    if data_dir:
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, filename)
    return os.path.join(os.path.dirname(__file__), "..", "Data", filename)
