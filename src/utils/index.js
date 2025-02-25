/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import {
  get,
  set,
  isObject,
  isString,
  trimEnd,
  isUndefined,
  isNull,
  isEmpty,
  trimStart,
  isNumber,
  omit,
  pick,
} from 'lodash'
import generate from 'nanoid/generate'
import moment from 'moment-mini'

import { PATTERN_LABEL, MODULE_KIND_MAP } from './constants'

/**
 * format size, output the value with unit
 * @param {Number} size - the number need to be format
 */
export const formatSize = size => {
  const divisor = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB']
  let index = 0
  if (!isNumber(size)) {
    return size
  }
  while (size >= divisor && index < units.length) {
    size = parseFloat(size / divisor).toFixed(2)
    index += 1
  }
  if (index === 0) {
    size = parseInt(size, 10)
  }
  return `${size} ${units[index]}`
}

/**
 * format used time(ms).
 * @param {Number} ms
 */
export const formatUsedTime = ms => {
  if (ms < 1000) {
    return `${ms} ms`
  }
  if (ms <= 60000) {
    return `${parseFloat(ms / 1000).toFixed(2)} s`
  }
  if (ms <= 3600000) {
    return `${parseFloat(ms / 60000).toFixed(2)} min`
  }
  return `${parseFloat(ms / 3600000).toFixed(2)} h`
}

export const formatDuration = (str, targetUnit = 's') => {
  const units = ['d', 'h', 'm', 's', 'ms']
  const unitConvertor = [24, 60, 60, 1000, 1]
  const [, value, unit] = str.match(/^([0-9.]*)(.*)$/)

  if (isUndefined(value) || isUndefined(unit)) {
    return str
  }

  let sourceIndex = units.indexOf(unit)
  const targetIndex = units.indexOf(targetUnit)

  let targetValue = parseFloat(value)
  if (sourceIndex < targetIndex) {
    while (sourceIndex !== targetIndex) {
      targetValue *= unitConvertor[sourceIndex]
      sourceIndex++
    }
  } else {
    while (sourceIndex !== targetIndex) {
      sourceIndex--
      targetValue /= unitConvertor[sourceIndex]
    }
  }

  return targetValue
}

/**
 * Flatten object. transfer {a:{b:{c:1}}} to {'a.b.c':1}
 * @param {Object} obj
 */
export function flattenObject(obj) {
  const result = {}

  function recurse(cur, prop) {
    if (Array.isArray(cur)) {
      if (cur.length > 0) {
        cur.forEach((item, index) => recurse(item, `${prop}[${index}]`))
      } else {
        result[prop] = []
      }
    } else if (isObject(cur)) {
      if (Object.keys(cur).length > 0) {
        Object.entries(cur).forEach(([key, value]) => {
          const _key = /\./g.test(key) ? `['${key}']` : `.${key}`
          recurse(value, prop ? `${prop}${_key}` : key)
        })
      } else {
        result[prop] = {}
      }
    } else {
      result[prop] = cur
    }
  }

  recurse(obj, '')
  return result
}

export const generateId = length =>
  generate('0123456789abcdefghijklmnopqrstuvwxyz', length || 6)

/**
 * join selector
 * @param {Object} selector
 */
export const joinSelector = (selector = {}) =>
  Object.entries(selector)
    .filter(entry => !isUndefined(entry[1]) && !isNull(entry[1]))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')

/**
 * parse string without error throw.
 * @param {string} json - json string need to be parsed
 * @param {object} defaultValue - if parse failed, return defaultValue
 */
export const safeParseJSON = (json, defaultValue) => {
  let result
  try {
    result = JSON.parse(json)
  } catch (e) {}

  if (!result && defaultValue !== undefined) {
    return defaultValue
  }
  return result
}

export const isSystemRole = role => /^system:/.test(role)

/**
 * wrap promise error
 * @param {Promise} promise
 */
export const to = promise =>
  promise
    .then(data => data)
    .catch(err => {
      console.warn(err)
      return []
    })

export const getLocalTime = time => {
  let formatTime = time

  if (time && isString(time) && time.indexOf(' +0000 UTC') !== -1) {
    formatTime = time.replace(' +0000 UTC', 'Z').replace(' ', 'T')
  }

  return moment.utc(formatTime).local()
}

export const capitalize = string =>
  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()

export const getQueryString = (params, hasEncode = true) =>
  Object.keys(params)
    .filter(key => params[key])
    .map(
      key =>
        `${key}=${hasEncode ? encodeURIComponent(params[key]) : params[key]}`
    )
    .join('&')

export const getFilterString = (
  params,
  fuzzyMatchKeys = ['name', 'app.kubernetes.io/name', 'label', 'annotation']
) =>
  Object.keys(params)
    .filter(key => !isUndefined(params[key]) && params[key] !== '')
    .map(key =>
      fuzzyMatchKeys.includes(key) && !/\|/g.test(params[key])
        ? `${key}~${trimStart(params[key])}`
        : `${key}=${trimStart(params[key])}`
    )
    .join(',')

export const isValidLabel = label =>
  Object.entries(label).every(
    ([key, value]) =>
      value.length <= 63 &&
      key.length <= (key.indexOf('/') !== -1 ? 253 : 63) &&
      key.replace(/\//g, '').replace(PATTERN_LABEL, '') === '' &&
      value.replace(PATTERN_LABEL, '') === ''
  )

export const updateLabels = (template, module, value) => {
  const formTemplate = template[MODULE_KIND_MAP[module]] || template

  set(formTemplate, 'metadata.labels', value)

  if (['deployments', 'daemonsets', 'statefulsets'].indexOf(module) !== -1) {
    set(formTemplate, 'spec.selector.matchLabels', value)
  }

  if (module === 'cronjobs') {
    set(formTemplate, 'spec.jobTemplate.metadata.labels', value)
  }

  if (['ingresses', 'persistentvolumeclaims'].indexOf(module) === -1) {
    set(formTemplate, 'spec.template.metadata.labels', value)
  }
}

export const updateFederatedAnnotations = template => {
  const annotations = get(template, 'metadata.annotations', {})
  const overrides = get(template, 'spec.overrides', [])

  overrides.forEach(od => {
    od.clusterOverrides = od.clusterOverrides || []
    const cod = od.clusterOverrides.find(
      item => item.path === '/metadata/annotations'
    )
    if (cod) {
      cod.value = annotations
    } else {
      od.clusterOverrides.push({
        path: '/metadata/annotations',
        value: annotations,
      })
    }
  })
  set(template, 'spec.overrides', overrides)
}

const merge = (origin, path, newObj) => {
  const data = get(origin, path)
  if (!data) {
    set(origin, path, newObj)
  } else {
    Object.assign(data, newObj)
  }
}

export const mergeLabels = (formData, labels) => {
  if (!formData || !formData.kind) {
    return
  }

  const isFederated = formData.kind.startsWith('Federated')
  const prefix = isFederated ? 'spec.template.' : ''

  isFederated && merge(formData, `metadata.labels`, labels)

  switch (formData.kind) {
    case 'Deployment':
    case 'DaemonSet':
    case 'StatefulSet':
      merge(formData, `${prefix}metadata.labels`, labels)
      merge(formData, `${prefix}spec.selector.matchLabels`, labels)
      merge(formData, `${prefix}spec.template.metadata.labels`, labels)
      break
    case 'Service':
      merge(formData, `${prefix}metadata.labels`, labels)
      merge(formData, `${prefix}spec.selector`, labels)
      break
    default:
      merge(formData, `${prefix}metadata.labels`, labels)
  }
}

export const withProps = (Component, props) => newProps => (
  <Component {...props} {...newProps} />
)

export const composeComponent = (...Components) => props => (
  <>
    {Components.map(Component => (
      <Component {...props} key={Component.name} />
    ))}
  </>
)

export const cpuFormat = (cpu, unit = 'Core') => {
  if (isUndefined(cpu) || cpu === null) {
    return cpu
  }

  const units = ['m', 'Core', 'k', 'M', 'G']
  const currentUnit = String(cpu).slice(-1)
  // if no unit, unit = 'Core'
  const currentUnitIndex =
    units.indexOf(currentUnit) > -1 ? units.indexOf(currentUnit) : 1
  const targetUnitIndex = units.indexOf(unit)

  let value =
    currentUnitIndex === 1
      ? Number(cpu)
      : Number(trimEnd(String(cpu), currentUnit))

  value *= 1000 ** (currentUnitIndex - targetUnitIndex)

  return Number(value.toFixed(3))
}

export const memoryFormat = (memory, unit = 'Mi') => {
  if (isUndefined(memory) || memory === null) {
    return memory
  }

  const units = ['ki', 'mi', 'gi', 'ti']
  const currentUnit = String(memory)
    .toLowerCase()
    .slice(-2)

  let currentUnitIndex =
    units.indexOf(currentUnit) > -1 ? units.indexOf(currentUnit) : 1
  const targetUnitIndex = units.indexOf(unit.toLowerCase())

  let value = Number(trimEnd(String(memory).toLowerCase(), currentUnit))

  if (/m$/g.test(String(memory))) {
    // transfer m to ki
    value = Number(trimEnd(String(memory), 'm')) / (1000 * 1024)
    currentUnitIndex = 0
  } else if (/^[0-9.]*$/.test(String(memory))) {
    // transfer bytes to ki
    value = Number(memory) / 1024
    currentUnitIndex = 0
  }

  value *= 1024 ** (currentUnitIndex - targetUnitIndex)

  if (String(value).indexOf('.') > -1) {
    value = Number(value.toFixed(3))
  }

  return value
}

export const cacheFunc = (key, func, context) => {
  context._funcCaches = context._funcCaches || {}

  if (!context._funcCaches[key]) {
    context._funcCaches[key] = func
  }

  return context._funcCaches[key]
}

export const getResourceCreator = item =>
  get(item, 'metadata.annotations["kubesphere.io/creator"]') ||
  get(item, 'metadata.annotations.creator') ||
  ''

export const getDescription = item =>
  get(item, 'metadata.annotations["kubesphere.io/description"]') ||
  get(item, 'metadata.annotations.desc') ||
  ''

export const getAliasName = item =>
  get(item, 'metadata.annotations["kubesphere.io/alias-name"]') ||
  get(item, 'metadata.annotations.displayName') ||
  ''

export const getDisplayName = item => {
  if (isEmpty(item)) {
    return ''
  }

  if (item.display_name) {
    return item.display_name
  }

  return `${item.name}${item.aliasName ? `(${item.aliasName})` : ''}`
}

export const getWebSocketProtocol = protocol => {
  if (protocol.startsWith('https')) {
    return 'wss'
  }
  return 'ws'
}

export const getDocsUrl = module => {
  const { url: prefix } = globals.config.documents
  const docUrl = get(globals.config, `resourceDocs[${module}]`, '')

  if (!docUrl) {
    return ''
  }

  return `${prefix}${docUrl}`
}

export const hasChinese = str => /.*[\u4E00-\u9FA5]+.*/.test(str)

export const getBrowserLang = () => {
  const lang = (navigator.language || navigator.browserLanguage).toLowerCase()

  if (lang === 'zh-tw') {
    return 'tc'
  }
  if (lang.indexOf('zh') !== -1) {
    return 'zh'
  }
  if (lang.indexOf('en') !== -1) {
    return 'en'
  }

  return globals.config.defaultLang || 'en'
}

export const toPromise = func =>
  new Promise(resolve => {
    func(() => {
      resolve()
    })
  })

export const getLanguageName = name => {
  const languageList = [
    'nodejs',
    'python',
    'java',
    'ruby',
    'php',
    'go',
    'nginx',
    'binary',
    'jar',
    'war',
  ]

  if (!name) return ''
  return languageList.find(language => name.indexOf(language) !== -1)
}

export const parseUrl = url => {
  const result = {}
  const keys = [
    'href',
    'origin',
    'protocol',
    'host',
    'hostname',
    'port',
    'pathname',
    'search',
    'hash',
  ]
  const regexp = /(([^:]+:)\/\/(([^:/?#]+)(:\d+)?))(\/[^?#]*)?(\?[^#]*)?(#.*)?/

  const match = regexp.exec(url)

  if (match) {
    for (let i = keys.length - 1; i >= 0; --i) {
      result[keys[i]] = match[i] ? match[i] : ''
    }
  }
  return result
}

export const replaceToLocalOrigin = url => {
  const path = get(parseUrl(url), 'pathname', `/${url}`)
  return `${window.location.protocol}//${window.location.host}${path}`
}

/**
 * send the K8s requests with dry run
 * @param {Object[]} requests - the requests need dry run.
 * @param {string} requests[].url - the url of a request
 * @param {Object} requests[].data - the data of a request
 */
export const withDryRun = async requests => {
  const dryRunPromises = requests.map(item =>
    request.post(`${item.url}?dryRun=All`, item.data)
  )

  await Promise.all(dryRunPromises)

  const promises = requests.map(item => request.post(item.url, item.data))

  return Promise.all(promises)
}

/**
 * Check if the page is apps page.
 * @param {String} path
 */
export const isAppsPage = (path = location.pathname) =>
  path === '/apps' || path.startsWith('/apps/app-')

export const isMemberClusterPage = (path = location.pathname, message) => {
  const clusterName = get(
    /\/clusters\/?([-0-9a-z]*)\/?/.exec(path),
    '1',
    'host'
  )
  const rules = [
    'token used before issued',
    'signature is invalid',
    'token not found in cache',
  ]
  const lowerMessage = message.toLowerCase()

  let isTokenOut = true

  rules.forEach(item => {
    if (lowerMessage.indexOf(item) > -1) {
      isTokenOut = false
    }
  })

  return clusterName !== 'host' && !isTokenOut
}

export const getClusterUrl = url => {
  let requestURL = url

  const reg = new RegExp(/\/(api|apis|kapis)\/(.*)\/?(klusters\/[^/]*)\/(.*)/)
  const match = requestURL.match(reg)

  if (match && match.length === 5) {
    requestURL = globals.app.isMultiCluster
      ? `/${match[1]}/${match[3].replace('klusters', 'clusters')}/${match[2]}/${
          match[4]
        }`
      : `/${match[1]}/${match[2]}/${match[4]}`
  }

  return requestURL.replace(/\/\/+/, '/')
}

export const parseDockerImage = url => {
  const match = url.match(
    /^(?:([^/]+)\/)?(?:([^/]+)\/)?([^@:/]+)(?:[@:](.+))?$/
  )

  if (!match) return {}

  let registry = match[1]
  let namespace = match[2]
  const repository = match[3]
  const tag = match[4]

  if (!namespace && registry && !/[:.]/.test(registry)) {
    namespace = registry
    registry = null
  }

  return {
    registry: registry || null,
    namespace: namespace || null,
    repository,
    tag: tag || null,
  }
}

export const lazy = ctor => () => ctor()

export const compareVersion = (v1 = '', v2 = '') => {
  const getVersion = str =>
    str
      .split('-')[0]
      .replace('v', '')
      .split('.')
      .map(item => parseInt(item, 10))

  const v1s = getVersion(v1)
  const v2s = getVersion(v2)

  const len = Math.min(v1s.length, v2s.length)
  let i = 0
  while (i < len) {
    if (v1s[i] < v2s[i]) {
      return -1
    }
    if (v1s[i] > v2s[i]) {
      return 1
    }
    i++
  }

  if (v1s.length < v2s.length) {
    return -1
  }

  if (v1s.length > v2s.length) {
    return 1
  }

  return 0
}

export const getContainerGpu = item => {
  if (!isEmpty(get(item, 'resources', undefined))) {
    const gpu = get(item, 'resources.gpu', { type: '', value: '' })
    item.resources.limits = pick(item.resources.limits, ['cpu', 'memory'])
    if (gpu.type !== '') {
      const value = isUndefined(gpu.value) ? '' : gpu.value
      set(item, `resources.limits["${gpu.type}"]`, value)
      set(item, `resources.requests["${gpu.type}"]`, value)
    }
  }
}

export const omitJobGpuLimit = (data, path) => {
  const containers = get(data, path, [])
  if (containers.length > 0) {
    const newContainer = containers.map(item => {
      const gpu = get(item, 'resources.gpu', {})
      if (isEmpty(gpu)) {
        return item
      }
      if (
        isEmpty(gpu.type) ||
        isEmpty(gpu.value) ||
        isUndefined(gpu.type) ||
        isUndefined(gpu.value)
      ) {
        const limits = get(item, 'resources.limits', {})
        const requests = get(item, 'resources.requests', {})
        set(item, 'resources.limits', omit(limits, `${gpu.type}`))
        set(item, 'resources.requests', omit(requests, `${gpu.type}`))
      }
      return omit(item, 'resources.gpu')
    })
    set(data, path, newContainer)
  }
}

export const getGpuFromRes = data => {
  if (data.length > 0) {
    const gpuDefault = get(data, '[0].limit.default', {})
    const gpu = isEmpty(gpuDefault) ? {} : omit(gpuDefault, ['cpu', 'memory'])
    const gpuKey = Object.keys(gpu)[0]
    if (isEmpty(gpu)) {
      set(data[0].limit, 'gpu', {
        type: '',
        value: '',
      })
    } else {
      data[0] = omit(data[0], [
        `limit.default['${gpuKey}']`,
        `limit.defaultRequest['${gpuKey}']`,
      ])
      set(data[0].limit, 'gpu', {
        type: gpuKey,
        value: Object.values(gpu)[0],
      })
    }
  }
}

export const resourceLimitKey = [
  'limits.cpu',
  'limits.memory',
  'requests.cpu',
  'requests.memory',
]

export const gpuTypeArr = ['requests.nvidia.com/gpu', 'limits.nvidia.com/gpu']
