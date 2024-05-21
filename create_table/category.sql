DROP TABLE IF EXISTS category;
CREATE TABLE category (
    id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '唯一标识',
    code VARCHAR(255) NOT NULL UNIQUE COMMENT'分类编码',
    name VARCHAR(255) NOT NULL COMMENT '分类名称',
    isParent TINYINT(1) NOT NULL COMMENT '是否父类'
);