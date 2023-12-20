import type { NextRequest } from 'next/server'
import { parse, stringify } from 'yaml'

export const maxDuration = 60

interface Profile {
  proxies: {
    name: string
  }[]
  'proxy-groups': {
    name: string
    type: string
    proxies: string[]
  }[]
  'rule-providers': {
    [key: string]: {
      type: string
      behavior: string
      url: string
      path: string
      interval: number
    }
  }
  rules: any
}

function filterProxies(proxies: Profile['proxies'], text: string) {
  const regex = new RegExp(`.*${text}.*`)
  return proxies.filter(i => regex.test(i.name)).map(i => i.name)
}

const areas = [
  '🇭🇰 香港',
  '🇹🇼 台湾',
  '🇺🇸 美国',
  '🇯🇵 日本',
  '🇬🇧 英国',
  '🇸🇬 新加坡',
  '🇲🇾 马来西亚',
  '🇦🇺 澳大利亚',
  '🇫🇷 法国',
  '🇰🇷 韩国',
  '🇨🇦 加拿大',
  '🇧🇷 巴西',
  '🇩🇪 德国',
  '🇮🇱 以色列',
]

export async function GET(request: NextRequest) {
  const subUrl = request.nextUrl.searchParams.get('url')
  if (!subUrl) {
    return new Response(null, { status: 404 })
  }
  const res = await fetch(subUrl, {
    headers: {
      'User-Agent': 'ClashForWindows/0.18.0 (Windows 10.0.19042)',
    },
  })
  const text = await res.text()
  const yaml = parse(text) as Profile

  const { proxies } = yaml

  yaml['proxy-groups'] = [
    {
      name: '♻️ 手动切换',
      type: 'select',
      proxies: ['DIRECT', ...areas, ...proxies.filter(i => {
        const regex = new RegExp(`^(?!.*(?:${areas.join('|')})).*$`)
        return regex.test(i.name)
      }).map((i: any) => i.name)],
    },
    { name: '🐱 OpenAI', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '🐱 BardAI', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '𝕏 Twitter', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '📲 Telegram', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '📺 Netflix', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '🎬 Bilibili', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    { name: '🎮 Steam', type: 'select', proxies: ['DIRECT', '♻️ 手动切换', ...areas] },
    ...areas.map(i => ({
      name: i,
      type: 'select',
      proxies: filterProxies(proxies, i),
    })),
  ]

  yaml['rule-providers'] = {
    'lan': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Lan/Lan.yaml',
      path: './ruleset/lan.yaml',
      interval: 86400,
    },
    'China': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/China/China.yaml',
      path: './ruleset/china.yaml',
      interval: 86400,
    },
    'ChinaDomain': {
      type: 'http',
      behavior: 'domain',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/China/China_Domain.yaml',
      path: './ruleset/China_Domain.yaml',
      interval: 86400,
    },
    'OpenAI': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI.yaml',
      path: './ruleset/OpenAI.yaml',
      interval: 86400,
    },
    'BardAI': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BardAI/BardAI.yaml',
      path: './ruleset/BardAI.yaml',
      interval: 86400,
    },
    'Netflix': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml',
      path: './ruleset/Netflix.yaml',
      interval: 86400,
    },
    'NetflixIP': {
      type: 'http',
      behavior: 'ipcidr',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix_IP.yaml',
      path: './ruleset/NetflixIP.yaml',
      interval: 86400,
    },
    'Bilibili': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml',
      path: './ruleset/Bilibili.yaml',
      interval: 86400,
    },
    'Steam': {
      type: 'http',
      behavior: 'classical',
      url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml',
      path: './ruleset/Steam.yaml',
      interval: 86400,
    },
  }

  yaml.rules = [
    'RULE-SET, lan, DIRECT',
    'IP-CIDR,172.16.0.0/12, DIRECT, no-resolve',
    'RULE-SET, China, DIRECT',
    'RULE-SET, ChinaDomain, DIRECT',
    'RULE-SET, OpenAI, 🐱 OpenAI',
    'RULE-SET, BardAI, 🐱 BardAI',
    'RULE-SET, Netflix, 📺 Netflix',
    'RULE-SET, NetflixIP, 📺 Netflix',
    'RULE-SET, Bilibili, 🎬 Bilibili',
    'RULE-SET, Steam, 🎮 Steam',
    'MATCH, ♻️ 手动切换',
  ]

  const response = new Response(stringify(yaml), {
    headers: {
      ...res.headers,
      'content-disposition': 'attachment;filename=karasu',
    },
  })
  return response
}
