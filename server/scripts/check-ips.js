#!/usr/bin/env node

/**
 * Attacker IP Scanner & Geolocation Lookup Tool
 * Fetches recent security logs from Render, extracts attacker IPs,
 * and performs geolocation and threat intelligence lookups.
 */

const { execSync } = require('child_process');
const http = require('http');

const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-d9etlcrrjlhs73d3r6qg';

async function lookupIp(ip) {
    return new Promise((resolve) => {
        const req = http.get(`http://ip-api.com/json/${ip}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ status: 'fail' });
                }
            });
        });
        req.on('error', () => resolve({ status: 'fail' }));
        req.setTimeout(3000, () => {
            req.destroy();
            resolve({ status: 'timeout' });
        });
    });
}

async function main() {
    console.log('='.repeat(65));
    console.log('🛡️  Campus Crave - Attacker IP & Threat Intelligence Scanner');
    console.log('='.repeat(65));
    console.log(`\n📡 Fetching recent security logs from Render (${SERVICE_ID})...\n`);

    let rawLogs = '';
    try {
        rawLogs = execSync(`render logs --resources ${SERVICE_ID} --limit 150 --confirm`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } catch (err) {
        console.error('❌ Failed to fetch Render logs:', err.message);
        console.log('Ensure you are logged in to the Render CLI: run `render whoami`');
        process.exit(1);
    }

    const events = [];
    const ipMap = new Map();

    const logLines = rawLogs.split('\n');
    const secRegex = /\[SECURITY\s*-\s*([^\]]+)\]\s*IP:\s*([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i;

    for (const line of logLines) {
        const match = line.match(secRegex);
        if (match) {
            const eventType = match[1].trim();
            const ip = match[2].trim();
            events.push({ line, eventType, ip });

            if (!ipMap.has(ip)) {
                ipMap.set(ip, { count: 0, types: new Set() });
            }
            const info = ipMap.get(ip);
            info.count++;
            info.types.add(eventType);
        }
    }

    if (ipMap.size === 0) {
        console.log('✅ No suspicious attack events or attacker IPs recorded in recent logs.');
        console.log('Your system is currently running with all security guards active.\n');
        return;
    }

    console.log(`⚠️  Detected ${events.length} security alert event(s) across ${ipMap.size} unique IP(s):\n`);

    for (const [ip, data] of ipMap.entries()) {
        console.log('-'.repeat(65));
        console.log(`🚨 Attacker IP:       ${ip}`);
        console.log(`   Events Triggered:  ${data.count} attempt(s) [${Array.from(data.types).join(', ')}]`);

        // Check if private/internal
        if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('127.')) {
            console.log(`   Classification:    Private Internal Subnet / Proxy Hop`);
            continue;
        }

        const geo = await lookupIp(ip);
        if (geo && geo.status === 'success') {
            console.log(`   Country / City:    ${geo.city || 'Unknown'}, ${geo.regionName || ''} (${geo.country || 'Unknown'})`);
            console.log(`   ISP / Carrier:     ${geo.isp || 'N/A'}`);
            console.log(`   Organization:      ${geo.org || 'N/A'} [${geo.as || ''}]`);
        } else {
            console.log(`   Location:          Lookup unavailable`);
        }
        console.log(`   Abuse Database:    https://www.abuseipdb.com/check/${ip}`);
    }

    console.log('-'.repeat(65));
    console.log('\n💡 To permanently block any malicious IP, add it to the BLOCKED_IPS env var in Render:');
    console.log('   Render Dashboard -> campus-crave-1 -> Environment -> BLOCKED_IPS=ip1,ip2\n');
}

main().catch(console.error);
