import mysql.connector
from mysql.connector import Error

class MySQLConnector:
    def __init__(self, config):
        self.config = config
        self.connection = None
        self.connect()

    def connect(self):
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                print("MySQL数据库连接成功")
        except Error as e:
            print(f"连接错误：{e}")

    def close(self):
        if self.connection.is_connected():
            self.connection.close()
            print("MySQL数据库连接已关闭")

    def execute_query(self, query):
        cursor = self.connection.cursor()
        try:
            cursor.execute(query)
            self.connection.commit()
            print("查询执行成功")
        except Error as e:
            print(f"查询错误：{e}")
            return False
        finally:
            cursor.close()
        return True

    def fetch_all(self, query):
        cursor = self.connection.cursor()
        try:
            cursor.execute(query)
            result = cursor.fetchall()
            return result
        except Error as e:
            print(f"查询错误：{e}")
            return None
        finally:
            cursor.close()

    def import_sql_file(self, file_path):
        try:
            with open(file_path, 'r') as f:
                sql_file = f.read()
            sql_commands = sql_file.split(';')
            for command in sql_commands:
                if command.strip() != '':
                    self.execute_query(command)
            print(f"文件 {file_path} 中的SQL命令已成功执行")
        except Error as e:
            print(f"执行SQL文件时出错：{e}")
        except IOError as e:
            print(f"读取文件时出错：{e}")

    def create_table(self, query):
        return self.execute_query(query)

    def insert(self, query, data):
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, data)
            self.connection.commit()
            print("数据插入成功")
        except Error as e:
            print(f"插入数据时出错：{e}")
            return False
        finally:
            cursor.close()
        return True

    def delete(self, query, data):
        cursor = self.connection.cursor()
        try:
            cursor.execute(query, data)
            self.connection.commit()
            print("数据删除成功")
        except Error as e:
            print(f"删除数据时出错：{e}")
            return False
        finally:
            cursor.close()
        return True
    
    def start_transaction(self):
        self.connection.start_transaction()

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()
