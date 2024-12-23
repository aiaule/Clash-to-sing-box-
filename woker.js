// KV 绑定名称为 RULES_KV

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Clash to sing-box 规则转换器</title>
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .input-group {
            margin: 20px 0;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        input[type="text"], input[type="checkbox"] {
            padding: 8px;
        }
        input[type="text"] {
            flex: 1;
        }
        .auto-update {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        button {
            padding: 8px 16px;
            cursor: pointer;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
        }
        button.delete {
            background: #f44336;
        }
        button.copy {
            background: #2196F3;
            padding: 4px 8px;
            font-size: 0.9em;
        }
        .rules-list {
            margin-top: 20px;
        }
        .rule-item {
            background: #f5f5f5;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
        }
        .rule-links {
            margin: 10px 0;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .link-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: white;
            padding: 8px;
            border-radius: 4px;
        }
        .link-url {
            flex: 1;
            word-break: break-all;
            font-family: monospace;
        }
        .error {
            color: red;
            margin: 10px 0;
        }
        .success {
            color: green;
            margin: 10px 0;
        }
        .copied {
            color: #4CAF50;
            font-size: 0.9em;
            margin-left: 10px;
            display: none;
        }
    </style>
</head>
<body>
    <h2>Clash YAML 转 sing-box 规则转换器</h2>
    <div class="input-group">
        <input type="text" id="yamlUrl" placeholder="输入 Clash YAML 规则链接">
        <input type="text" id="ruleName" placeholder="规则名称(例如:claude)">
        <div class="auto-update">
            <input type="checkbox" id="autoUpdate" checked>
            <label for="autoUpdate">每日自动更新</label>
        </div>
        <button onclick="convertRule()">转换</button>
    </div>
    <div id="error" class="error"></div>
    <div id="success" class="success"></div>
    <div class="rules-list">
        <h3>已转换的规则列表:</h3>
        <div id="rulesList"></div>
    </div>

    <script>
        async function loadRules() {
            const response = await fetch('/list');
            const rules = await response.json();
            const listDiv = document.getElementById('rulesList');
            listDiv.innerHTML = rules.map(rule => {
                const jsonUrl = \`\${location.origin}/rules/\${rule.name}.json\`;
                const srsUrl = \`\${location.origin}/rules/\${rule.name}.srs\`;
                return \`<div class="rule-item">
                    <div>
                    <div>规则名称: \${rule.name}</div>
                        <div class="rule-links">
                            <div class="link-item">
                                <span>JSON格式:</span>
                                <span class="link-url">\${jsonUrl}</span>
                                <button class="copy" onclick="copyLink('\${jsonUrl}', this)">复制链接</button>
                                <span class="copied">已复制!</span>
                            </div>
                            <div class="link-item">
                                <span>SRS格式:</span>
                                <span class="link-url">\${srsUrl}</span>
                                <button class="copy" onclick="copyLink('\${srsUrl}', this)">复制链接</button>
                                <span class="copied">已复制!</span>
                            </div>
                        </div>
                        <div>上次更新: \${rule.lastUpdate || '未知'}</div>
                        <div>自动更新: \${rule.autoUpdate ? '是' : '否'}</div>
                        \${rule.sourceUrl ? \`<div>源地址: \${rule.sourceUrl}</div>\` : ''}
                    </div>
                    <div>
                        <button onclick="updateRule('\${rule.name}')">立即更新</button>
                        <button class="delete" onclick="deleteRule('\${rule.name}')">删除</button>
                    </div>
                </div>\`;
            }).join('');
        }

        async function copyLink(text, button) {
            try {
                await navigator.clipboard.writeText(text);
                const copiedSpan = button.nextElementSibling;
                copiedSpan.style.display = 'inline';
                setTimeout(() => {
                    copiedSpan.style.display = 'none';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
            }
        }

        async function convertRule() {
            const yamlUrl = document.getElementById('yamlUrl').value;
            const ruleName = document.getElementById('ruleName').value;
            const autoUpdate = document.getElementById('autoUpdate').checked;
            const errorDiv = document.getElementById('error');
            const successDiv = document.getElementById('success');
            
            if (!yamlUrl || !ruleName) {
                errorDiv.textContent = '请输入 YAML 链接和规则名称';
                successDiv.textContent = '';
                return;
            }

            try {
                const response = await fetch('/convert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ yamlUrl, ruleName, autoUpdate })
                });

                const result = await response.json();
                if (result.error) {
                    errorDiv.textContent = result.error;
                    successDiv.textContent = '';
                } else {
                    errorDiv.textContent = '';
                    successDiv.textContent = '转换成功！';
                    loadRules();
                }
            } catch (err) {
                errorDiv.textContent = '转换失败: ' + err.message;
                successDiv.textContent = '';
            }
        }

        async function deleteRule(ruleName) {
            if (!confirm(\`确定要删除规则 "\${ruleName}" 吗？\`)) {
                return;
            }

            try {
                const response = await fetch(\`/rules/\${ruleName}\`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    document.getElementById('success').textContent = '删除成功！';
                    document.getElementById('error').textContent = '';
                    loadRules();
                } else {
                    const result = await response.json();
                    document.getElementById('error').textContent = result.error || '删除失败';
                    document.getElementById('success').textContent = '';
                }
            } catch (err) {
                document.getElementById('error').textContent = '删除失败: ' + err.message;
                document.getElementById('success').textContent = '';
            }
        }

        async function updateRule(ruleName) {
            try {
                const response = await fetch(\`/rules/\${ruleName}/update\`, {
                    method: 'POST'
                });

                if (response.ok) {
                    document.getElementById('success').textContent = '更新成功！';
                    document.getElementById('error').textContent = '';
                    loadRules();
                } else {
                    const result = await response.json();
                    document.getElementById('error').textContent = result.error || '更新失败';
                    document.getElementById('success').textContent = '';
                }
            } catch (err) {
                document.getElementById('error').textContent = '更新失败: ' + err.message;
                document.getElementById('success').textContent = '';
            }
        }

        // 页面加载时获取规则列表
        loadRules();
    </script>
</body>
</html>
`;

// 存储规则元数据的键名前缀
const METADATA_PREFIX = 'meta:';
const RULE_PREFIX = 'rule:';

// 获取规则元数据
async function getRuleMetadata(ruleName) {
    const metadata = await RULES_KV.get(METADATA_PREFIX + ruleName);
    return metadata ? JSON.parse(metadata) : null;
}

// 保存规则元数据
async function saveRuleMetadata(ruleName, metadata) {
    await RULES_KV.put(METADATA_PREFIX + ruleName, JSON.stringify(metadata));
}

// 保存规则内容
async function saveRule(ruleName, content) {
    try {
        // 存储规则内容
        await RULES_KV.put(RULE_PREFIX + ruleName, JSON.stringify(content));
        console.log('规则保存成功:', ruleName, content);
        return true;
    } catch (err) {
        console.error('保存规则失败:', err);
        return false;
    }
}

// 获取规则内容
async function getRule(ruleName) {
    try {
        const key = RULE_PREFIX + ruleName;
        console.log('尝试获取规则:', key);
        const content = await RULES_KV.get(key);
        console.log('获取到的规则内容:', content);
        return content ? JSON.parse(content) : null;
    } catch (err) {
        console.error('获取规则失败:', err);
        return null;
    }
}

// 删除规则
async function deleteRule(ruleName) {
    await RULES_KV.delete(RULE_PREFIX + ruleName);
    await RULES_KV.delete(METADATA_PREFIX + ruleName);
}

// 检查并更新规则
async function checkAndUpdateRule(ruleName) {
    const metadata = await getRuleMetadata(ruleName);
    if (!metadata || !metadata.autoUpdate || !metadata.sourceUrl) {
        return false;
    }

    // 检查上次更新时间
    const lastUpdate = new Date(metadata.lastUpdate || 0);
    const now = new Date();
    const hoursSinceLastUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    // 如果距离上次更新不足24小时，跳过
    if (hoursSinceLastUpdate < 24) {
        return false;
    }

    try {
        // 获取源内容
        const response = await fetch(metadata.sourceUrl);
        if (!response.ok) {
            throw new Error("获取源内容失败: HTTP " + response.status);
        }

        const content = await response.text();
        let rules;

        // 尝试解析内容
        try {
            const jsonContent = JSON.parse(content);
            if (jsonContent.version && Array.isArray(jsonContent.rules)) {
                rules = jsonContent.rules;
            } else {
                throw new Error('无效的 JSON 规则格式');
            }
        } catch (e) {
            const yamlRules = await parseYamlRules(content);
            rules = yamlRules.map(convertRule).filter(rule => rule !== null);
        }

        if (rules.length === 0) {
            throw new Error('没有找到有效的规则');
        }

        // 更新规则
        const converted = {
            version: 2,
            rules: mergeRules(rules)
        };

        // 使用新的存储方式
        await saveRule(ruleName, converted);
        
        // 更新元数据
        metadata.lastUpdate = now.toISOString();
        await saveRuleMetadata(ruleName, metadata);

        return true;
    } catch (err) {
        console.error("更新规则 " + ruleName + " 失败:", err);
        return false;
    }
}

async function parseYamlRules(yamlContent) {
  try {
    const lines = yamlContent.split('\n');
    const rules = [];
    let inPayloadSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否进入payload部分
      if (trimmedLine === 'payload:') {
        inPayloadSection = true;
        continue;
      }
      
      // 如果在payload部分且行以'-'开头
      if (inPayloadSection && trimmedLine.startsWith('-')) {
        const rule = trimmedLine.substring(1).trim();
        if (rule) {
          rules.push(rule);
        }
      }
    }
    
    if (rules.length === 0) {
      throw new Error('YAML文件中没有找到有效的规则');
    }
    
    console.log('解析出的规则数量:', rules.length);
    return rules;
    
  } catch (err) {
    console.error('YAML解析错误:', err);
    throw new Error(`YAML解析失败: ${err.message}`);
  }
}

function convertRule(rule) {
  console.log('正在转换规则:', rule);
  
  if (typeof rule !== 'string') {
    console.log('跳过非字符串规则:', rule);
    return null;
  }
  
  // 使用正则表达式更准确地匹配规则
  const ruleMatch = rule.match(/^([^,]+),([^,]+)(?:,.+)?$/);
  if (!ruleMatch) {
    console.log('规则格式不匹配:', rule);
    return null;
  }
  
  const [_, type, value] = ruleMatch;
  const trimmedType = type.trim().toUpperCase();
  const trimmedValue = value.trim();
  
  // 创建一个空对象来存储规则
  const ruleObj = {};
  
  switch(trimmedType) {
            case 'DOMAIN-SUFFIX':
      ruleObj.domain_suffix = [trimmedValue];
      break;
            case 'DOMAIN':
      ruleObj.domain = [trimmedValue];
      break;
            case 'DOMAIN-KEYWORD':
      ruleObj.domain_keyword = [trimmedValue];
      break;
    case 'IP-CIDR':
    case 'IP-CIDR6':
      ruleObj.ip_cidr = [trimmedValue];
      break;
    case 'SRC-IP-CIDR':
      ruleObj.source_ip_cidr = [trimmedValue];
      break;
    case 'SRC-PORT':
      ruleObj.source_port = [parseInt(trimmedValue)];
      break;
    case 'DST-PORT':
      ruleObj.port = [parseInt(trimmedValue)];
      break;
    case 'DOMAIN-REGEX':
    case 'URL-REGEX':
      ruleObj.domain_regex = [trimmedValue];
      break;
            default:
      console.log('不支持的规则类型:', trimmedType);
              return null;
          }
  
  return ruleObj;
}

// 合并相同类型的规则
function mergeRules(rules) {
    const mergedRules = [];
    const ruleMap = new Map();

    for (const rule of rules) {
        const type = Object.keys(rule)[0];
        const values = rule[type];
        
        if (ruleMap.has(type)) {
            ruleMap.get(type).push(...values);
        } else {
            ruleMap.set(type, [...values]);
        }
    }

    for (const [type, values] of ruleMap) {
        // 去重
        const uniqueValues = [...new Set(values)];
        mergedRules.push({ [type]: uniqueValues });
    }

    return mergedRules;
}

// 添加二进制转换函数
function convertToSRS(jsonRules) {
    // 创建一个二进制数据写入器
    const writer = new BinaryWriter();
    
    // 写入魔术数字 (sing-box rule-set)
    const magic = new Uint8Array([0x73, 0x72, 0x73, 0x00]); // "srs\0"
    writer.writeBytes(magic);
    
    // 写入版本号 (2)
    writer.writeUint32(2);
    
    // 写入规则数量
    writer.writeUint32(jsonRules.rules.length);
    
    // 写入每个规则
    for (const rule of jsonRules.rules) {
        const type = Object.keys(rule)[0];
        const values = rule[type];
        
        // 写入规则类型
        const typeMap = {
            'domain': 0,
            'domain_suffix': 1,
            'domain_keyword': 2,
            'domain_regex': 3,
            'ip_cidr': 4,
            'source_ip_cidr': 5,
            'source_port': 6,
            'port': 7,
            'process_name': 8,
            'process_path': 9,
            'network': 10,
            'domain_full': 11,
            'process_path_regex': 12,
            'network_type': 13,
            'network_is_expensive': 14,
            'network_is_constrained': 15
        };
        
        writer.writeUint8(typeMap[type] || 0);
        
        // 写入值数量
        writer.writeUint32(values.length);
        
        // 写入每个值
        for (const value of values) {
            switch(type) {
                case 'source_port':
                case 'port':
                    writer.writeUint16(value);
                    break;
                case 'ip_cidr':
                case 'source_ip_cidr':
                    writer.writeIPCIDR(value);
                    break;
                default:
                    writer.writeString(value);
                    break;
            }
        }
    }
    
    return writer.getBuffer();
}

// 二进制写入器类
class BinaryWriter {
    constructor() {
        this.chunks = [];
        this.size = 0;
    }
    
    writeBytes(bytes) {
        this.chunks.push(bytes);
        this.size += bytes.length;
    }
    
    writeUint8(value) {
        const buffer = new Uint8Array(1);
        buffer[0] = value;
        this.chunks.push(buffer);
        this.size += 1;
    }
    
    writeUint16(value) {
        const buffer = new Uint8Array(2);
        new DataView(buffer.buffer).setUint16(0, value, true); // 小端序
        this.chunks.push(buffer);
        this.size += 2;
    }
    
    writeUint32(value) {
        const buffer = new Uint8Array(4);
        new DataView(buffer.buffer).setUint32(0, value, true); // 小端序
        this.chunks.push(buffer);
        this.size += 4;
    }
    
    writeString(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        this.writeUint32(bytes.length);
        this.chunks.push(bytes);
        this.size += bytes.length;
    }
    
    writeIPCIDR(cidr) {
        const [ip, bits] = cidr.split('/');
        const parts = ip.split('.');
        
        if (parts.length === 4) { // IPv4
            this.writeUint8(4); // IPv4 type
            const ipNum = parts.reduce((num, part) => (num << 8) + parseInt(part), 0);
            const buffer = new Uint8Array(4);
            new DataView(buffer.buffer).setUint32(0, ipNum, false); // 大端序
            this.chunks.push(buffer);
            this.writeUint8(parseInt(bits));
        } else { // IPv6
            this.writeUint8(6); // IPv6 type
            const ipv6Parts = ip.split(':');
            const buffer = new Uint8Array(16);
            let offset = 0;
            for (let i = 0; i < 8; i++) {
                const value = parseInt(ipv6Parts[i] || '0', 16);
                new DataView(buffer.buffer).setUint16(offset, value, false); // 大端序
                offset += 2;
            }
            this.chunks.push(buffer);
            this.writeUint8(parseInt(bits));
        }
    }
    
    getBuffer() {
        const buffer = new Uint8Array(this.size);
        let offset = 0;
        for (const chunk of this.chunks) {
            buffer.set(chunk, offset);
            offset += chunk.length;
        }
        return buffer;
    }
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 添加 CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    // 处理根路径请求
    if (path === '/' || path === '') {
        return new Response(HTML_TEMPLATE, {
            headers: { 
                'Content-Type': 'text/html;charset=UTF-8',
                ...corsHeaders
            }
        });
    }

    // 处理规则列表请求
    if (path === '/list') {
        try {
            const keys = await RULES_KV.list();
            const rules = [];
            
            for (const key of keys.keys) {
                if (key.name.startsWith(RULE_PREFIX)) {
                    const name = key.name.slice(RULE_PREFIX.length);
                    const metadata = await getRuleMetadata(name);
                    rules.push({
                        name,
                        ...(metadata || {})
                    });
                }
            }
            
            return new Response(JSON.stringify(rules), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: '获取规则列表失败' }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    // 处理规则更新请求
    if (path.match(/^\/rules\/[^/]+\/update$/) && request.method === 'POST') {
        try {
            const ruleName = path.split('/')[2];
            const updated = await checkAndUpdateRule(ruleName);
            
            if (updated) {
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            } else {
                return new Response(JSON.stringify({ 
                    error: '规则更新失败或不需要更新'
                }), {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
        } catch (err) {
      return new Response(JSON.stringify({ 
                error: err.message
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    // 处理规则删除请求
    if (path.match(/^\/rules\/[^/]+$/) && request.method === 'DELETE') {
        try {
            const ruleName = path.split('/')[2];
            await deleteRule(ruleName);
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
    } catch (err) {
      return new Response(JSON.stringify({ 
                error: err.message
      }), {
        status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
      });
    }
  }

  // 提供规则访问
    if (path.startsWith('/rules/')) {
        const isSrs = path.endsWith('.srs');
        const isJson = path.endsWith('.json');
        
        if (isSrs || isJson) {
            const ruleName = path.slice(7).replace(/\.(json|srs)$/, '');
            console.log('请求规则:', ruleName, '格式:', isSrs ? 'srs' : 'json');
            
            try {
                const rule = await getRule(ruleName);
                console.log('获取到规则:', rule);

                if (!rule) {
                    console.log('规则未找到:', ruleName);
                    return new Response(JSON.stringify({
                        error: 'Rule not found',
                        message: `Rule '${ruleName}' does not exist`
                    }), { 
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    });
                }

                // 检查是否需要更新
                checkAndUpdateRule(ruleName).catch(console.error);
                
                if (isJson) {
                    return new Response(JSON.stringify(rule), {
                        headers: { 
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache',
                            ...corsHeaders
                        }
                    });
                } else {
                    // 转换为 SRS 格式
                    try {
                        console.log('转换规则为SRS格式:', rule);
                        const srsBuffer = convertToSRS(rule);
                        return new Response(srsBuffer, {
                            headers: { 
                                'Content-Type': 'application/octet-stream',
                                'Cache-Control': 'no-cache',
                                ...corsHeaders
                            }
                        });
                    } catch (err) {
                        console.error('SRS转换失败:', err);
                        return new Response(JSON.stringify({
                            error: 'SRS conversion failed',
                            message: err.message
                        }), {
                            status: 500,
                            headers: { 
                                'Content-Type': 'application/json',
                                ...corsHeaders
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('处理规则请求失败:', err);
                return new Response(JSON.stringify({
                    error: 'Error',
                    message: err.message
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
        }
        return new Response(JSON.stringify({
            error: 'Invalid format',
            message: 'Only .json and .srs formats are supported'
        }), { 
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }

    // 处理规则转换请求
    if (path === '/convert' && request.method === 'POST') {
        try {
            const { yamlUrl, ruleName, autoUpdate } = await request.json();
            
            if (!yamlUrl || !ruleName) {
                throw new Error('缺少必要的参数: yamlUrl 或 ruleName');
            }
            
            // 验证规则名称格式
            if (!/^[a-zA-Z0-9_-]+$/.test(ruleName)) {
                throw new Error('规则名称只能包含字母、数字、下划线和横线');
            }

            console.log('开始处理URL:', yamlUrl, '规则名:', ruleName);
            
            // 获取内容
            const response = await fetch(yamlUrl);
            if (!response.ok) {
                throw new Error('获取内容失败: HTTP ' + response.status);
            }
            
            const content = await response.text();
            console.log('获取到的内容长度:', content.length);
            
            if (!content.trim()) {
                throw new Error('内容为空');
            }

            let rules;
            try {
                const jsonContent = JSON.parse(content);
                if (jsonContent.version && Array.isArray(jsonContent.rules)) {
                    rules = jsonContent.rules;
                } else {
                    throw new Error('无效的 JSON 规则格式');
                }
            } catch (e) {
                const yamlRules = await parseYamlRules(content);
                rules = yamlRules.map(convertRule).filter(rule => rule !== null);
            }

            if (rules.length === 0) {
                throw new Error('没有找到有效的规则');
            }

            const converted = {
                version: 2,
                rules: mergeRules(rules)
            };

            // 保存规则
            await saveRule(ruleName, converted);
            
            // 保存元数据
            await saveRuleMetadata(ruleName, {
                sourceUrl: yamlUrl,
                autoUpdate: !!autoUpdate,
                lastUpdate: new Date().toISOString()
            });

            return new Response(JSON.stringify({ 
                success: true,
                ruleCount: rules.length,
                rules: converted,
                urls: {
                    json: `${url.origin}/rules/${ruleName}.json`,
                    srs: `${url.origin}/rules/${ruleName}.srs`
                }
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (err) {
            console.error('处理请求时发生错误:', err);
            return new Response(JSON.stringify({ 
                error: err.message,
                type: err.name
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
    });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});