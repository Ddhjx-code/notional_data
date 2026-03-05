# 国家统计局数据接口使用文档

> 基础地址：`https://data.stats.gov.cn`  
> 无需鉴权，所有接口均为公开访问

---

## 目录

- [接口概览](#接口概览)
- [核心概念](#核心概念)
- [接口详情](#接口详情)
- [编码规则](#编码规则)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

---

## 接口概览

| 接口 | 地址 | 方法 | 用途 |
|------|------|------|------|
| 搜索指标 | `/search.htm` | GET | 关键词搜索，直接获取数据和指标code |
| 获取指标树 | `/easyquery.htm` | POST | 浏览指标分类体系 |
| 获取时间维度 | `/easyquery.htm` | GET | 查询可选时间范围 |
| 查询统计数据 | `/easyquery.htm` | GET | 获取完整统计数据集 |

---

## 核心概念

### 数据库代码

| dbcode | cn | 含义 |
|--------|----|------|
| `hgjd` | `B01` | 宏观季度数据 |
| `hgnd` | `C01` | 宏观年度数据 |

### 维度代码

| wdcode | 含义 |
|--------|------|
| `zb` | 指标维度 |
| `sj` | 时间维度 |

### 时间编码

```
季度：
  2025A → 2025年第一季度
  2025B → 2025年第二季度
  2025C → 2025年第三季度
  2025D → 2025年第四季度

快捷范围（季度数据用）：
  LAST6  → 最近6个季度
  LAST12 → 最近12个季度
  LAST18 → 最近18个季度

年度：
  2025 → 2025年
  2024 → 2024年
```

### 指标编码

```
A01       → 一级分类（国民经济核算）
A0101     → 二级分类
A010101   → 叶子指标（国内生产总值_当季值）
A010102   → 叶子指标（国内生产总值_累计值）

规律：
  位数越多层级越深
  末尾奇数 = 当季值/当期值
  末尾偶数 = 累计值
```

---

## 接口详情

### 1. 搜索指标

```
GET /search.htm
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `s` | string | ✅ | 搜索关键词（需 URL 编码） |
| `m` | string | ✅ | 固定值 `searchdata` |
| `db` | string | ❌ | 数据库筛选，空=全部，可选`年度数据`/`季度数据` |
| `p` | number | ❌ | 页码，从 `0` 开始 |

**示例**

```
GET /search.htm?s=%E4%BA%BA%E5%9D%87%E5%8F%AF%E6%94%AF%E9%85%8D%E6%94%B6%E5%85%A5&m=searchdata&db=&p=0
```

**响应**

```json
{
  "pagecount": 200,
  "pagecurrent": 0,
  "result": [
    {
      "data": "43377",
      "db": "年度数据",
      "reg": "全国",
      "sj": "2025年",
      "zb": "居民人均可支配收入(元)",
      "report": "cn=C01&zb=A0A01&sj=2025"
    }
  ]
}
```

**report 字段解析（重要）**

```
report = "cn=C01&zb=A0A01&sj=2025"

cn=C01    → 报表类型（C01=年度, B01=季度）
zb=A0A01  → 指标 code，可直接用于 QueryData
sj=2025   → 时间 code
```

> ✅ 搜索接口是获取指标 code 最快的方式，无需逐层遍历指标树

---

### 2. 获取指标分类树

```
POST /easyquery.htm
Content-Type: application/x-www-form-urlencoded
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `m` | string | ✅ | 固定值 `getTree` |
| `id` | string | ✅ | 父节点ID，根节点传 `zb` |
| `dbcode` | string | ✅ | 数据库代码，如 `hgjd` |
| `wdcode` | string | ✅ | 固定值 `zb` |

**示例**

```
POST /easyquery.htm
Body: id=zb&dbcode=hgjd&wdcode=zb&m=getTree
```

**响应**

```json
[
  {
    "id": "A01",
    "pid": "",
    "name": "国民经济核算",
    "isParent": true,
    "dbcode": "hgjd",
    "wdcode": "zb"
  },
  {
    "id": "A0803",
    "pid": "A08",
    "name": "规模以上文化及相关产业企业利润总额",
    "isParent": false,
    "dbcode": "hgjd",
    "wdcode": "zb"
  }
]
```

**字段说明**

| 字段 | 说明 |
|------|------|
| `id` | 节点ID，下钻时作为 `id` 参数传入 |
| `pid` | 父节点ID |
| `name` | 分类/指标名称 |
| `isParent` | `true`=有子节点可继续下钻，`false`=叶子指标可查数据 |

**树形结构示意**

```
getTree(id=zb)
├── A01 国民经济核算 (isParent=true)
│     └── getTree(id=A01)
│           └── A0101 (isParent=true)
│                 └── getTree(id=A0101)
│                       ├── A010101 国内生产总值_当季值 ✅
│                       └── A010102 国内生产总值_累计值 ✅
└── A08 文化 (isParent=true)
      └── getTree(id=A08)
            ├── A0801 营业收入 (isParent=true)
            └── A0803 利润总额 (isParent=false) ✅
```
### 3. 获取时间维度

```
GET /easyquery.htm?m=getOtherWds
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `m` | string | ✅ | 固定值 `getOtherWds` |
| `dbcode` | string | ✅ | 数据库代码 |
| `rowcode` | string | ✅ | 固定值 `zb` |
| `colcode` | string | ✅ | 固定值 `sj` |
| `wds` | string | ✅ | 已选维度，初始传 `[]` |
| `k1` | number | ✅ | 当前时间戳，防缓存 |

**示例**

```
GET /easyquery.htm?m=getOtherWds&dbcode=hgjd&rowcode=zb&colcode=sj&wds=%5B%5D&k1=1749123456789
```

**响应**

```json
{
  "returncode": 200,
  "returndata": [
    {
      "wdcode": "sj",
      "wdname": "时间",
      "issj": true,
      "selcode": "last6",
      "nodes": [
        { "code": "LAST6",  "name": "最近6季度" },
        { "code": "LAST12", "name": "最近12季度" },
        { "code": "LAST18", "name": "最近18季度" }
      ]
    }
  ]
}
```

---

### 4. 查询统计数据

```
GET /easyquery.htm?m=QueryData
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `m` | string | ✅ | 固定值 `QueryData` |
| `dbcode` | string | ✅ | 数据库代码 |
| `rowcode` | string | ✅ | 固定值 `zb` |
| `colcode` | string | ✅ | 固定值 `sj` |
| `wds` | string | ✅ | 固定维度筛选，JSON数组字符串 |
| `dfwds` | string | ✅ | 默认维度筛选（时间），JSON数组字符串 |
| `k1` | number | ✅ | 当前时间戳 |
| `h` | number | ❌ | 固定值 `1` |

**wds / dfwds 格式说明**

```json
// 筛选特定指标
wds = [{"wdcode":"zb","valuecode":"A010101"}]

// 最近6季度
dfwds = [{"wdcode":"sj","valuecode":"LAST6"}]

// 指定具体季度
dfwds = [{"wdcode":"sj","valuecode":"2025D"}]

// 不筛选
wds = []
dfwds = []
```

**示例**

```
GET /easyquery.htm?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj&wds=%5B%5D&dfwds=%5B%7B%22wdcode%22%3A%22sj%22%2C%22valuecode%22%3A%22LAST6%22%7D%5D&k1=1749123456789&h=1
```

**响应**

```json
{
  "returncode": 200,
  "returndata": {
    "hasdatacount": 66,
    "datanodes": [
      {
        "code": "zb.A010101_sj.2025D",
        "data": {
          "data": 387911.3,
          "strdata": "387911.3",
          "hasdata": true,
          "dotcount": 1
        },
        "wds": [
          { "wdcode": "zb", "valuecode": "A010101" },
          { "wdcode": "sj", "valuecode": "2025D" }
        ]
      }
    ],
    "wdnodes": [
      {
        "wdcode": "zb",
        "wdname": "指标",
        "nodes": [
          {
            "code": "A010101",
            "name": "国内生产总值_当季值",
            "unit": "亿元",
            "dotcount": 1
          }
        ]
      },
      {
        "wdcode": "sj",
        "wdname": "时间",
        "nodes": [
          { "code": "2025D", "name": "2025年第四季度" },
          { "code": "2025C", "name": "2025年第三季度" }
        ]
      }
    ]
  }
}
```

**datanode code 格式**

```
"zb.A010101_sj.2025D"
  │   │         │
  │   │         └── 时间 code
  │   └──────────── 指标 code
  └──────────────── 行维度（固定格式）
```

| 字段 | 说明 |
|------|------|
| `datanodes[].data.data` | 数值（number） |
| `datanodes[].data.strdata` | 数值（string） |
| `datanodes[].data.hasdata` | 是否有数据 |
| `datanodes[].data.dotcount` | 小数位数 |
| `wdnodes` | 维度元数据，含指标名称、单位 |

---

## 使用示例

### 示例一：搜索指标直接获取最新值

> 场景：查询居民人均可支配收入最新数据

**Step 1：关键词搜索**

```bash
curl "https://data.stats.gov.cn/search.htm?\
s=%E4%BA%BA%E5%9D%87%E5%8F%AF%E6%94%AF%E9%85%8D%E6%94%B6%E5%85%A5\
&m=searchdata&db=年度数据&p=0"
```

**Step 2：解析结果**

```
result[0].zb     = "居民人均可支配收入(元)"
result[0].data   = "43377"        ← 直接拿到最新值
result[0].sj     = "2025年"
result[0].report = "cn=C01&zb=A0A01&sj=2025"
                              ↑
                         后续查询用这个 code
```

> ✅ 简单查询直接用搜索接口，无需再调 QueryData

---

### 示例二：查询 GDP 近6季度走势

> 场景：获取 GDP 当季值近6季度历史数据

**Step 1：搜索拿到指标 code**

```bash
curl "https://data.stats.gov.cn/search.htm?\
s=GDP&m=searchdata&db=季度数据&p=0"

# 从 report 解析得：zb=A010101，dbcode 对应 hgjd
```

**Step 2：查询历史数据**

```bash
curl "https://data.stats.gov.cn/easyquery.htm?\
m=QueryData\
&dbcode=hgjd\
&rowcode=zb\
&colcode=sj\
&wds=%5B%7B%22wdcode%22%3A%22zb%22%2C%22valuecode%22%3A%22A010101%22%7D%5D\
&dfwds=%5B%7B%22wdcode%22%3A%22sj%22%2C%22valuecode%22%3A%22LAST6%22%7D%5D\
&k1=1749123456789\
&h=1"
```

wds 解码后：
```json
[{"wdcode":"zb","valuecode":"A010101"}]
```

dfwds 解码后：
```json
[{"wdcode":"sj","valuecode":"LAST6"}]
```

**Step 3：解析响应**

```javascript
const nodes = data.returndata.datanodes;
const result = nodes
  .filter(n => n.data.hasdata)
  .map(n => ({
    indicator: n.wds.find(w => w.wdcode === 'zb').valuecode,
    time:      n.wds.find(w => w.wdcode === 'sj').valuecode,
    value:     n.data.data
  }));

// result:
// [
//   { indicator: 'A010101', time: '2025D', value: 387911.3 },
//   { indicator: 'A010101', time: '2025C', value: 354106.2 },
//   ...
// ]
```

---

### 示例三：遍历指标树获取某分类全部叶子指标

> 场景：获取"文化"分类下所有可查指标

```javascript
async function getLeafNodes(id, dbcode) {
  const res = await fetch('https://data.stats.gov.cn/easyquery.htm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `id=${id}&dbcode=${dbcode}&wdcode=zb&m=getTree`
  });
  const nodes = await res.json();

  const leaves = [];
  for (const node of nodes) {
    if (!node.isParent) {
      leaves.push(node); // 叶子节点，可查数据
    } else {
      const children = await getLeafNodes(node.id, dbcode);
      leaves.push(...children);
    }
  }
  return leaves;
}

// 获取文化分类下所有指标
const leaves = await getLeafNodes('A08', 'hgjd');
console.log(leaves.map(n => `${n.id}: ${n.name}`));
```
---

## 最佳实践

### 1. 选择正确的调用路径

根据场景选择最短路径，避免不必要的请求：

```
场景一：已知关键词，只需最新值
  → 直接用 search.htm
  → 一次请求搞定，result[].data 就是最新值

场景二：已知关键词，需要历史时间序列
  → search.htm 拿 zb code
  → easyquery.htm?m=QueryData 查历史数据
  → 共两次请求

场景三：需要某分类下所有指标
  → easyquery.htm?m=getTree 递归下钻
  → 再批量 QueryData
  → 适合数据采集/全量同步场景
```

---

### 2. 优先用搜索接口获取 code

```
❌ 低效方式：
   getTree(zb) → getTree(A01) → getTree(A0101) → 找到 A010101
   需要多次请求才能定位指标

✅ 高效方式：
   search.htm?s=GDP
   → report 字段直接给你 zb=A010101
   → 一次请求定位指标 code
```

---

### 3. k1 时间戳处理

所有 GET 请求都需要带 `k1` 参数，用当前毫秒时间戳即可：

```javascript
const k1 = Date.now();

const url = `https://data.stats.gov.cn/easyquery.htm`
  + `?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj`
  + `&wds=[]&dfwds=[]`
  + `&k1=${k1}&h=1`;
```

---

### 4. wds / dfwds 参数编码

这两个参数是 JSON 数组，需要 URL 编码后传入：

```javascript
const wds = JSON.stringify([
  { wdcode: 'zb', valuecode: 'A010101' }
]);

const dfwds = JSON.stringify([
  { wdcode: 'sj', valuecode: 'LAST6' }
]);

const url = `https://data.stats.gov.cn/easyquery.htm`
  + `?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj`
  + `&wds=${encodeURIComponent(wds)}`
  + `&dfwds=${encodeURIComponent(dfwds)}`
  + `&k1=${Date.now()}&h=1`;
```

---

### 5. 处理无数据的情况

部分时间节点可能没有数据，解析时需过滤：

```javascript
const validData = datanodes.filter(n => n.data.hasdata === true);

// 不要直接用 n.data.data，hasdata=false 时值无意义
```

---

### 6. 从 report 字段解析 cn → dbcode 映射

搜索结果的 report 给的是 cn 代码，QueryData 需要 dbcode，需要转换：

```javascript
function cnToDbcode(cn) {
  const map = {
    'B01': 'hgjd',  // 季度
    'C01': 'hgnd',  // 年度
  };
  return map[cn] ?? 'hgjd';
}

// 用法
const report = 'cn=C01&zb=A0A01&sj=2025';
const params = Object.fromEntries(
  report.split('&').map(p => p.split('='))
);
// params = { cn: 'C01', zb: 'A0A01', sj: '2025' }

const dbcode = cnToDbcode(params.cn); // 'hgnd'
const zbCode = params.zb;             // 'A0A01'
```

---

### 7. 指标树递归时控制并发

指标树层级较深，递归请求时避免同时发起过多请求：

```javascript
async function getLeafNodes(id, dbcode, delay = 200) {
  // 加延迟，避免请求过于频繁
  await new Promise(r => setTimeout(r, delay));

  const res = await fetch('https://data.stats.gov.cn/easyquery.htm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `id=${id}&dbcode=${dbcode}&wdcode=zb&m=getTree`
  });
  const nodes = await res.json();

  const leaves = [];
  // 串行而非并行，避免触发限流
  for (const node of nodes) {
    if (!node.isParent) {
      leaves.push(node);
    } else {
      const children = await getLeafNodes(node.id, dbcode, delay);
      leaves.push(...children);
    }
  }
  return leaves;
}
```

---

### 8. 本地缓存指标树

指标分类体系变动频率极低，建议本地缓存，避免重复请求：

```javascript
// 建议缓存策略
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

const cache = new Map();

async function getTreeCached(id, dbcode) {
  const key = `${dbcode}_${id}`;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchTree(id, dbcode);
  cache.set(key, { data, ts: Date.now() });
  return data;
}
```

---

### 9. 完整封装示例

```javascript
class NbsClient {
  constructor() {
    this.base = 'https://data.stats.gov.cn';
    this.cnMap = { B01: 'hgjd', C01: 'hgnd' };
  }

  // 搜索指标，返回格式化结果
  async search(keyword, db = '', page = 0) {
    const url = `${this.base}/search.htm`
      + `?s=${encodeURIComponent(keyword)}`
      + `&m=searchdata&db=${encodeURIComponent(db)}&p=${page}`;

    const res = await fetch(url);
    const json = await res.json();

    return json.result.map(item => {
      const reportParams = Object.fromEntries(
        item.report.split('&').map(p => p.split('='))
      );
      return {
        name:    item.zb,
        value:   item.data,
        time:    item.sj,
        db:      item.db,
        zbCode:  reportParams.zb,
        cnCode:  reportParams.cn,
        dbcode:  this.cnMap[reportParams.cn] ?? 'hgjd',
        sjCode:  reportParams.sj,
      };
    });
  }

  // 查询时间序列数据
  async queryTimeSeries(zbCode, dbcode, timeRange = 'LAST6') {
    const wds   = JSON.stringify([{ wdcode: 'zb', valuecode: zbCode }]);
    const dfwds = JSON.stringify([{ wdcode: 'sj', valuecode: timeRange }]);

    const url = `${this.base}/easyquery.htm`
      + `?m=QueryData&dbcode=${dbcode}&rowcode=zb&colcode=sj`
      + `&wds=${encodeURIComponent(wds)}`
      + `&dfwds=${encodeURIComponent(dfwds)}`
      + `&k1=${Date.now()}&h=1`;

    const res  = await fetch(url);
    const json = await res.json();

    if (json.returncode !== 200) {
      throw new Error(`查询失败: ${json.returncode}`);
    }

    // 拿单位信息
    const zbMeta = json.returndata.wdnodes
      .find(w => w.wdcode === 'zb')?.nodes ?? [];
    const unitMap = Object.fromEntries(
      zbMeta.map(n => [n.code, n.unit])
    );

    // 拿时间名称
    const sjMeta = json.returndata.wdnodes
      .find(w => w.wdcode === 'sj')?.nodes ?? [];
    const timeMap = Object.fromEntries(
      sjMeta.map(n => [n.code, n.name])
    );

    return json.returndata.datanodes
      .filter(n => n.data.hasdata)
      .map(n => {
        const zbCode = n.wds.find(w => w.wdcode === 'zb').valuecode;
        const sjCode = n.wds.find(w => w.wdcode === 'sj').valuecode;
        return {
          zbCode,
          sjCode,
          timeName: timeMap[sjCode],
          value:    n.data.data,
          unit:     unitMap[zbCode] ?? '',
        };
      })
      .sort((a, b) => b.sjCode.localeCompare(a.sjCode));
  }
}

// 使用示例
const client = new NbsClient();

// 查询人均可支配收入
const results = await client.search('人均可支配收入', '年度数据');
console.log(results[0]);
// {
//   name:   "居民人均可支配收入(元)",
//   value:  "43377",
//   time:   "2025年",
//   zbCode: "A0A01",
//   dbcode: "hgnd",
// }

// 查 GDP 近6季度
const series = await client.queryTimeSeries('A010101', 'hgjd', 'LAST6');
console.log(series);
// [
//   { sjCode: '2025D', timeName: '2025年第四季度', value: 387911.3, unit: '亿元' },
//   { sjCode: '2025C', timeName: '2025年第三季度', value: 354106.2, unit: '亿元' },
//   ...
// ]
```

---

## 接口速查表

| 需求 | 接口 | 关键参数 |
|------|------|---------|
| 关键词找指标+最新值 | `GET /search.htm` | `s`, `m=searchdata` |
| 拿指标 code | `GET /search.htm` | 解析 `result[].report` 的 `zb` 字段 |
| 浏览分类体系 | `POST /easyquery.htm` | `m=getTree`, `id` |
| 查历史时间序列 | `GET /easyquery.htm` | `m=QueryData`, `wds`, `dfwds` |
| 查可选时间范围 | `GET /easyquery.htm` | `m=getOtherWds` |

