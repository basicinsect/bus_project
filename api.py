import json
import codecs

def test():   
    with open('static/lines.json') as json_file:
        data = json.load(json_file)
        str = json.dumps(data, ensure_ascii=False)
        return str  