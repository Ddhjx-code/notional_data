# National Data Fetcher

## Overview
This Python project fetches national statistical data from the National Bureau of Statistics of China and stores it into a MySQL database. It includes functionality to create database tables, insert data, and manage database connections.

## Requirements
- Python 3.x
- Requests library
- MySQL Connector/Python
- Pandas

## Installation
To install the required packages, run:
```bash
pip install requests mysql-connector-python pandas
```

## Database Configuration
Database connection parameters are set in the config dictionary within the national_data.py module. Update the parameters according to your database setup.

## Usage
Update database configuration in national_data.py.
Run the main script national_data.py to fetch and store data.

```bash
python national_data.py
```

## Modules
- mysql_connect.py: Handles MySQL database connection and operations.
- national_data.py: Fetches data from the National Bureau of Statistics API and stores it into the database.

## Data code
- Database codes and their respective names are stored in dbcode.json.
- The zb.json file is an example,contains the category and sub-category codes used to query different types of national data.
- The wbcode.json file (if utilized) may contain additional codes relevant to the data fetch process.

## Contributing
Contributions to the code are welcome. Please ensure that you follow the project’s coding standards and write appropriate unit tests.

## License
[MIT License](./License)

