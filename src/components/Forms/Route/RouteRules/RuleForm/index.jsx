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

import { get, isEmpty } from 'lodash'
import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import {
  Alert,
  Form,
  Input,
  RadioButton,
  RadioGroup,
  Select,
} from '@kube-design/components'

import { ArrayInput, RulePath } from 'components/Inputs'

import { ReactComponent as BackIcon } from 'assets/back.svg'

import { PATTERN_HOST } from 'utils/constants'

import ClusterSelect from './ClusterSelect'

import styles from './index.scss'

export default class RuleForm extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    secrets: PropTypes.array,
    services: PropTypes.array,
    gateway: PropTypes.object,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
  }

  static defaultProps = {
    data: {},
    secrets: [],
    services: [],
    gateway: {},
    onSave() {},
    onCancel() {},
  }

  static contextTypes = {
    registerSubRoute: PropTypes.func,
    resetSubRoute: PropTypes.func,
  }

  constructor(props) {
    super(props)

    this.state = {
      type: this.enableAutoGenerated ? this.getType(props.data) : 'specify',
      service: '',
      protocol: get(props, 'data.protocol', 'http'),
    }

    this.formRef = React.createRef()
  }

  componentDidMount() {
    const { registerSubRoute } = this.context
    const { onCancel } = this.props

    registerSubRoute && registerSubRoute(this.handleSubmit, onCancel)
  }

  get protocols() {
    return [
      { label: 'HTTP', value: 'http' },
      { label: 'HTTPS', value: 'https' },
    ]
  }

  get secrets() {
    return this.props.secrets.map(item => ({
      label: item.name,
      value: item.name,
    }))
  }

  get clusters() {
    return get(this.props, 'projectDetail.clusters', []).slice()
  }

  get defaultClusters() {
    return get(this.props, 'projectDetail.clusters', []).map(item => item.name)
  }

  get enableAutoGenerated() {
    const { isFederated, gateway } = this.props
    return !isFederated && !isEmpty(gateway.defaultIngress)
  }

  getType(data) {
    const host = get(data, 'host')

    if (!host) {
      return 'auto'
    }

    const { gateway, projectDetail, namespace: ns } = this.props
    const service = get(data, 'http.paths[0].backend.service.name')
    const namespace =
      get(
        projectDetail,
        '_originData.metadata.labels["kubesphere.io/namespace"]'
      ) || ns

    const _host = gateway.isHostName
      ? gateway.defaultIngress
      : `${service}.${namespace}.${gateway.defaultIngress}.nip.io`

    return host === _host ? 'auto' : 'specify'
  }

  checkItemValid = item =>
    item.path &&
    item.backend &&
    item.backend.service.name &&
    item.backend.service.port

  pathValidator = (rule, value, callback) => {
    if (!value) {
      return callback()
    }

    if (value.some(item => !this.checkItemValid(item))) {
      return callback({ message: t('INVALID_PATH_DESC'), field: rule.field })
    }

    const isExist = this.handlePathExistValidator(value)

    if (isExist) {
      return callback({ message: t('PATH_EXIST'), field: rule.field })
    }

    callback()
  }

  handlePathExistValidator = value => {
    const pathList = value.map(item => item.path)
    let isExist = false

    pathList.forEach(item => {
      const length = pathList.length
      let i = 0
      let count = 0

      while (i <= length) {
        if (item === pathList[i]) {
          count++
        }

        if (count > 1) {
          isExist = true
          break
        }

        i++
      }
    })
    return isExist
  }

  handleGoBack = () => {
    const { resetSubRoute } = this.context

    resetSubRoute && resetSubRoute()

    this.props.onCancel()
  }

  handleProtocolChange = value => {
    this.setState({ protocol: value })
  }

  handleModeChange = value => {
    this.setState({ type: value })
  }

  handleSubmit = callback => {
    const { onSave } = this.props
    const form = this.formRef.current

    form &&
      form.validate(() => {
        const data = form.getData()
        if (this.state.type === 'auto') {
          const { gateway, projectDetail, namespace: ns } = this.props
          const service = get(data, 'http.paths[0].backend.service.name')
          const namespace =
            get(
              projectDetail,
              '_originData.metadata.labels["kubesphere.io/namespace"]'
            ) || ns
          onSave({
            ...data,
            protocol: 'http',
            host: gateway.isHostName
              ? gateway.defaultIngress
              : `${service}.${namespace}.${gateway.defaultIngress}.nip.io`,
          })
        } else {
          onSave(data)
        }
        callback && callback()
      })
  }

  renderForm() {
    const { type, protocol } = this.state

    return (
      <>
        {type === 'specify' && (
          <>
            <Form.Item
              label={t('DOMAIN_NAME_TCAP')}
              rules={[
                { required: true, message: t('DOMAIN_NAME_EMPTY_DESC') },
                {
                  pattern: PATTERN_HOST,
                  message: t('INVALID_DOMAIN_DESC'),
                },
              ]}
            >
              <Input name="host" autoFocus={true} />
            </Form.Item>
            <Form.Item label={t('PROTOCOL')}>
              <Select
                name="protocol"
                defaultValue="http"
                onChange={this.handleProtocolChange}
                options={this.protocols}
              />
            </Form.Item>
            {protocol === 'https' && (
              <Form.Item label={t('SECRET')}>
                <Select
                  name="secretName"
                  options={this.secrets}
                  placeholder=" "
                />
              </Form.Item>
            )}
          </>
        )}
        <Form.Item
          label={t('PATH_PL')}
          rules={[
            { required: true, message: t('PATH_EMPTY_DESC') },
            { validator: this.pathValidator, checkOnSubmit: true },
          ]}
        >
          <ArrayInput
            name="http.paths"
            itemType="object"
            addText={t('ADD')}
            checkItemValid={this.checkItemValid}
          >
            <RulePath services={this.props.services} />
          </ArrayInput>
        </Form.Item>
      </>
    )
  }

  render() {
    const { data, className, isFederated } = this.props
    const { type } = this.state

    return (
      <div className={classNames(styles.wrapper, className)}>
        <div className="h4">
          <a className="custom-icon" onClick={this.handleGoBack}>
            <BackIcon />
          </a>
          {t('SET_ROUTING_RULES')}
        </div>
        <div className={styles.formWrapper}>
          <Form ref={this.formRef} data={data}>
            {isFederated && (
              <Form.Group label={t('CLUSTER')}>
                <Form.Item>
                  <ClusterSelect
                    name="clusters"
                    options={this.clusters}
                    defaultValue={this.defaultClusters}
                  />
                </Form.Item>
              </Form.Group>
            )}
            {!this.enableAutoGenerated && (
              <Alert
                className="margin-b12"
                message={t.html('NO_GATEWAY_DESC')}
                type="warning"
              />
            )}
            <Form.Group noWrapper>
              {!isFederated && (
                <Form.Item label={t('MODE_TCAP')}>
                  <RadioGroup
                    mode="button"
                    buttonWidth={155}
                    value={type}
                    onChange={this.handleModeChange}
                    size="small"
                  >
                    <RadioButton
                      value="auto"
                      disabled={!this.enableAutoGenerated}
                    >
                      {t('AUTO_GENERATE_TCAP')}
                    </RadioButton>
                    <RadioButton value="specify">
                      {t('SPECIFY_DOMAIN_TCAP')}
                    </RadioButton>
                  </RadioGroup>
                </Form.Item>
              )}
              <Alert
                className="margin-t12 margin-b12"
                message={t.html(`RULE_SETTING_MODE_${type.toUpperCase()}`)}
                type="info"
              />
              {this.renderForm()}
            </Form.Group>
          </Form>
        </div>
      </div>
    )
  }
}
