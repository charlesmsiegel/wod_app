import json


def load_config(filename='config.json'):
    with open(filename, 'r') as f:
        config = json.load(f)
    return config
