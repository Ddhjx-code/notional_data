import json
import time

import jsonpath
import requests
from mysql_connect import MySQLConnector
import pandas as pd
import traceback



config = {
    'user': 'username',
    'password': 'password',
    'host': 'database-url',
    'database': 'national_data_test',
    'raise_on_warnings': True,
}


def endpoint():
    return "https://data.stats.gov.cn/easyquery.htm"

def population():
    url="https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=hgnd&rowcode=zb&colcode=sj&wds=%5B%5D&dfwds=%5B%7B%22wdcode%22%3A%22zb%22%2C%22valuecode%22%3A%22A0301%22%7D%5D&k1=1715768382619&h=1"
    response = requests.get(url)
    response_data = json.loads(response.text)
    return response_data

def set_category(id, dbcode,wdcode,db):
    url = endpoint()
    params = {
        "id": f"{id}",
        "dbcode": f"{dbcode}",
        "wdcode": f"{wdcode}",
        "m": "getTree"
    }
    response = requests.post(url, params=params)
    json_data = response.json()
    for row in json_data:
        insert_query = f'''
        INSERT INTO category (code, name, isParent)
        VALUES (%s, %s, %s)
        '''
        db.execute_query(insert_query, (row['id'], row['name'], row['isParent']))
        if row['isParent']:
            set_category(row["id"], db)
    print(response.text)

def get_national_data(valuecode_zb,valuecode_sj):
    url = endpoint()
    current_timestamp_ms = time.time() * 1000
    print(f"Current timestamp (milliseconds): {current_timestamp_ms}")
    # 构建参数
    params = {
        "m": "QueryData",
        "dbcode": "hgnd",
        "rowcode": "zb",
        "colcode": "sj",
        "wds": '[]',
        "dfwds": f'[{{"wdcode": "zb", "valuecode": "{valuecode_zb}"}},{{"wdcode": "sj", "valuecode": "{valuecode_sj}"}}]',
        "k1": f"{current_timestamp_ms}",
        "h": 1
    }
    max_retries = 5
    retries = 0
    while retries < max_retries:
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raise an HTTPError if the HTTP request returned an unsuccessful status code
            json_data = json.loads(response.text)
            return json_data  # If successful, return the JSON data
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError: Could not decode JSON from response. {e}")
            retries += 1
            if retries >= max_retries:
                print("Max retries reached, giving up.")
                return None
            print(f"Retrying... ({retries}/{max_retries})")
            # Add a delay before retrying (optional)
            time.sleep(2)  # Sleep for 2 seconds before retrying
    return None 
    

def get_code_detail(response_data):
    # 简化JSON数据
    simplified_data = []
    for wdnodes in response_data["returndata"]["wdnodes"]:
        for node in wdnodes['nodes']:
            simplified_data.append({
                'code': node.get('code'),
                'name': node.get('name'),
                'unit': node.get('unit'),
                'wdcode': wdnodes.get('wdcode'),
                'wdname': wdnodes.get('wdname')
            })

    # 输出简化后的JSON数据
    return simplified_data

#简化JSON数据
def simplified_data(response_data):
    wddata = get_code_detail(response_data)
    datanodes = response_data["returndata"]["datanodes"]
    simplified_data = []
    for datanode in datanodes:
        zb_code=datanode["wds"][0]["valuecode"]
        year = datanode["wds"][1]["valuecode"]
        zb_name = find_wd_name(wddata,"zb",zb_code)
        value = datanode["data"]["data"]
        unit = find_wd_unit(wddata,"zb",zb_code)
        simplified_data.append({
            'zb_code': zb_code,
            'zb_name': zb_name,
            'year': year,
            'value': value,
            'unit': unit
        })
    return simplified_data

#获取指标名
def find_wd_name(wddata,wdcode,zb_code):
    for d in wddata:
        if d['code'] == zb_code and d['wdcode'] == wdcode:
            return d["name"]

#获取单位
def find_wd_unit(wddata,wdcode,zb_code):
    for d in wddata:
        if d['code'] == zb_code and d['wdcode'] == wdcode:
            return d["unit"]

#创建表
def create_table():
    db = MySQLConnector(config)
    db.import_sql_file('./create_table/national_data.sql')
    db.close()

#插入数据
def insert_query(data, table_name, db):
    values = []
    for row in data:
        values.append(f"({row['year']}, '{row['zb_code']}', '{row['zb_name']}', {row['value']}, '{row['unit']}')")
    
    # 构造批量插入的SQL语句
    insert_query = f'''
    INSERT INTO {table_name} (year, zb_code, zb_name, value, unit)
    VALUES {','.join(values)}
    '''
    db.execute_query(insert_query)

def set_national_data(db):
    select_query = '''SELECT code FROM `category` WHERE `isParent` = 0'''
    result = db.fetch_all(select_query)
    for code in result:
        response_data = get_national_data(code[0],"LAST30")
        s_data = simplified_data(response_data)
        insert_query(s_data,"national_data",db)
        time.sleep(5)

def main():
    #将分类数据插入到对应表中
    db = MySQLConnector(config)
    
    try:
        set_category("zb", db)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()
    
    #获取每个分类的数据并存入数据库
    db = MySQLConnector(config)
    try:
        set_national_data(db)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()




