# 国家统计局数据获取工具

## 项目概述
本项目是一个Python脚本工具，用于从中国国家统计局获取数据，并将数据存储到MySQL数据库中。它包含了创建数据库表、插入数据以及管理数据库连接等功能。
（本代码仅供参考使用，暂无法直接运行）

## 环境要求
- Python 3.x
- Requests 库
- MySQL Connector/Python
- Pandas 库

## 安装指南
安装所需库，请运行以下命令：
```bash
pip install requests mysql-connector-python pandas
```

## 数据库配置
在 national_data.py 模块中的 config 字典里设置数据库连接参数。根据数据库设置更新这些参数。

## 使用方法
1. 在 national_data.py 中更新数据库配置。
2. 根据create_table中的sql文件，创建对应的表
3. 运行主脚本 national_data.py 以获取并存储数据。

```bash
python national_data.py
```

## 模块介绍
- mysql_connect.py：处理MySQL数据库连接和操作。
- national_data.py：从国家统计局API获取数据，并将其存储到数据库中。

## 数据编码对应
- dbcode.json：存储数据库代码及其相应的名称。
- zb.json：包含用于查询不同类型国家数据的类别和子类别代码。
- wbcode.json：可能包含与数据获取过程相关的额外代码（如果使用的话）。

## 贡献
欢迎对本代码进行修改。请确保遵循项目的编码标准。

## 开源协议
[MIT License](./License)



