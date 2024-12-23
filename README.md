 # Clash to sing-box 规则转换器

这是一个基于 Cloudflare Workers 的在线工具，用于将 Clash 规则转换为 sing-box 规则格式。支持将 Clash YAML 格式的规则文件转换为 sing-box 的 JSON 和 SRS (sing-box rule-set) 格式。

## 功能特点

- 🚀 在线转换 Clash YAML 规则到 sing-box 格式
- 💾 支持 JSON 和 SRS (sing-box rule-set) 两种输出格式
- 🔄 支持规则自动更新（可选）
- 📝 支持规则管理（添加、删除、更新）
- 🌐 完全基于浏览器，无需本地安装
- ⚡ 基于 Cloudflare Workers，快速响应
- 🔒 支持 CORS，可跨域调用

## 支持的规则类型

- DOMAIN
- DOMAIN-SUFFIX
- DOMAIN-KEYWORD
- DOMAIN-REGEX
- IP-CIDR
- IP-CIDR6
- SRC-IP-CIDR
- SRC-PORT
- DST-PORT

## 部署说明

1. 在 Cloudflare Workers 中创建新的 Worker
2. 复制 `worker.js` 的内容到 Worker 编辑器中
3. 在 Cloudflare Workers 中创建一个 KV 命名空间，命名为 `RULES_KV`
4. 将 KV 命名空间绑定到 Worker，变量名设置为 `RULES_KV`
5. 部署 Worker

## 使用方法

### Web 界面使用

1. 访问部署后的 Worker URL
2. 在输入框中填入 Clash YAML 规则链接
3. 输入规则名称（仅支持字母、数字、下划线和横线）
4. 选择是否启用自动更新
5. 点击转换按钮

### API 接口

#### 转换规则

```http
POST /convert
Content-Type: application/json

{
    "yamlUrl": "https://example.com/clash-rules.yaml",
    "ruleName": "rule-name",
    "autoUpdate": true
}
```

#### 获取规则列表

```http
GET /list
```

#### 获取规则内容

```http
GET /rules/{ruleName}.json  // JSON 格式
GET /rules/{ruleName}.srs   // SRS 格式
```

#### 更新规则

```http
POST /rules/{ruleName}/update
```

#### 删除规则

```http
DELETE /rules/{ruleName}
```

## 注意事项

1. 规则名称只能包含字母、数字、下划线和横线
2. 自动更新间隔为 24 小时
3. 建议使用 CDN 加速规则访问
4. 单个规则文件大小建议不超过 1MB

## 开源协议

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 致谢

感谢所有为这个项目提供帮助和建议的贡献者。
