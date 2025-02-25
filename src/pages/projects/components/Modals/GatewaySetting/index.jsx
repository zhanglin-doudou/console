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

import { get, set, isEmpty } from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import {
  Form,
  Button,
  RadioButton,
  RadioGroup,
  Select,
  Icon,
  Toggle,
} from '@kube-design/components'
import { Modal } from 'components/Base'
import { PropertiesInput, AnnotationsInput } from 'components/Inputs'
import Title from 'components/Forms/Base/Title'

import { CLUSTER_PROVIDERS } from 'utils/constants'

import { observable, toJS } from 'mobx'
import { observer } from 'mobx-react'
import { CLUSTER_PROVIDERS_ANNOTATIONS } from './contants'

import styles from './index.scss'

@observer
export default class GatewaySettingModal extends React.Component {
  static propTypes = {
    template: PropTypes.object,
    visible: PropTypes.bool,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    isSubmitting: PropTypes.bool,
  }

  static defaultProps = {
    template: {},
    visible: false,
    isSubmitting: false,
    onOk() {},
    onCancel() {},
  }

  @observable
  template = this.props.detail || {}

  @observable
  options = []

  constructor(props) {
    super(props)

    this.form = React.createRef()

    this.state = {
      isChecked: JSON.parse(
        get(
          this.template,
          'spec.deployment.annotations["servicemesh.kubesphere.io/enabled"]',
          false
        )
      ),
    }

    const annotations = get(this.template, 'spec.service.annotations')
    const type = get(this.template, 'spec.service.type')

    if (isEmpty(annotations) && type === 'LoadBalancer') {
      set(
        this.template,
        'spec.service.annotations',
        globals.config.loadBalancerDefaultAnnotations
      )
    }
  }

  getTypeOptions = () => [
    { label: 'NodePort', value: 'NodePort' },
    { label: 'LoadBalancer', value: 'LoadBalancer' },
  ]

  handleOk = () => {
    const { onOk } = this.props
    const { isChecked } = this.state

    set(
      this.template,
      'spec.deployment.annotations["servicemesh.kubesphere.io/enabled"]',
      isChecked ? 'true' : 'false'
    )

    onOk(this.template)
  }

  handleTypeChange = type => {
    const annotations = get(this.template, 'spec.service.annotations', {})

    if (type === 'LoadBalancer') {
      set(
        this.template,
        'spec.service.annotations',
        isEmpty(annotations)
          ? globals.config.loadBalancerDefaultAnnotations
          : annotations
      )
    } else {
      set(this.template, 'spec.service.annotations', {})
    }

    this.setState({ type })
  }

  providerOptionRenderer = option => (
    <>
      <Icon className="margin-r8" name={option.icon} type="light" size={20} />
      {option.label}
    </>
  )

  handleAnnotations = value => {
    this.options = Object.keys(CLUSTER_PROVIDERS_ANNOTATIONS[value])
    this.setAnnotations({})
  }

  setAnnotations = value => {
    set(this.template, 'spec.service.annotations', value)
    this.forceUpdate()
  }

  renderLoadBalancerSupport = () => {
    return (
      <div className={styles.loadBalancer}>
        <Form.Item label={t('LOAD_BALANCER_PROVIDER')}>
          <Select
            options={CLUSTER_PROVIDERS}
            placeholder=" "
            optionRenderer={this.providerOptionRenderer}
            onChange={this.handleAnnotations}
            name="metadata.annotations['kubesphere.io/annotations']"
          ></Select>
        </Form.Item>
      </div>
    )
  }

  handleToggleChange = value => {
    this.setState({ isChecked: value })
  }

  render() {
    const { visible, onCancel, cluster, isSubmitting } = this.props
    const { isChecked } = this.state

    return (
      <Modal
        width={1162}
        title={t('SET_GATEWAY')}
        onCancel={onCancel}
        visible={visible}
        bodyClassName={styles.modalBody}
        closable={false}
        hideFooter
      >
        <div className={styles.body}>
          <Title title={t('SET_GATEWAY')} desc={t('SET_GATEWAY_DESC')} />
          <div className={styles.wrapper}>
            <div className={styles.content}>
              <Form ref={this.form} data={this.template}>
                <Form.Item label={t('ACCESS_MODE')} className={styles.types}>
                  <RadioGroup
                    name="spec.service.type"
                    mode="button"
                    buttonWidth={155}
                    onChange={this.handleTypeChange}
                    size="small"
                  >
                    <RadioButton value="NodePort">NodePort</RadioButton>
                    <RadioButton value="LoadBalancer">LoadBalancer</RadioButton>
                  </RadioGroup>
                </Form.Item>

                {globals.app.hasClusterModule(cluster, 'servicemesh') && (
                  <>
                    <div className={styles.toggle}>
                      {t('APPLICATION_GOVERNANCE')}
                      <Toggle
                        checked={isChecked}
                        onChange={this.handleToggleChange}
                        onText={t('ENABLE')}
                        offText={t('DISABLE')}
                      />
                    </div>
                    <div className={styles.toggleTip}>
                      {t('GATEWAY_APPLICATION_GOVERNANCE_TIP')}
                    </div>
                  </>
                )}
                {get(this.template, 'spec.service.type') === 'LoadBalancer' && (
                  <>
                    {this.renderLoadBalancerSupport()}
                    <Form.Item label={t('ANNOTATION_PL')}>
                      <AnnotationsInput
                        controlled
                        options={toJS(this.options)}
                        className={styles.objectBg}
                        name="spec.service.annotations"
                        addText={t('ADD')}
                      />
                    </Form.Item>
                  </>
                )}
                <Form.Item label={t('CONFIGURATION_OPTIONS')}>
                  <PropertiesInput
                    className={styles.objectBg}
                    name="spec.controller.config"
                    addText={t('ADD')}
                  />
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <Button
            onClick={onCancel}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {t('CANCEL')}
          </Button>
          <Button
            type="control"
            onClick={this.handleOk}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {t('OK')}
          </Button>
        </div>
      </Modal>
    )
  }
}
