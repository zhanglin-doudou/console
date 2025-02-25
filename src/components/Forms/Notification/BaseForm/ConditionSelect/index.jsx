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
import { isEmpty } from 'lodash'

import { Select, Input, Icon, Notify } from '@kube-design/components'
import { TagInput } from 'components/Inputs'

import { SEVERITY_LEVEL } from 'configs/alerting/metrics/rule.config'
import { PATTERN_NAME } from 'utils/constants'

import styles from './index.scss'

export default class ConditionSelect extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.getInitialData()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      const { key = '', operator = '', values = [] } = this.props.value || {}
      this.setState({
        key,
        operator,
        values,
      })
    }
  }

  get keys() {
    return [
      {
        label: t('ALERTING_NAME'),
        value: 'alertname',
      },
      {
        label: t('ALERTING_SEVERITY'),
        value: 'severity',
      },
      {
        label: t('PROJECT'),
        value: 'namespace',
      },
      {
        label: t('POD'),
        value: 'pod',
      },
      {
        label: t('CONTAINER'),
        value: 'container',
      },
    ]
  }

  get operators() {
    return [
      {
        label: t('INCLUDES_VALUES'),
        value: 'In',
      },
      {
        label: t('DOES_NOT_INCLUDE_VALUES'),
        value: 'NotIn',
      },
      {
        label: t('EXISTS'),
        value: 'Exists',
      },
      {
        label: t('DOES_NOT_EXIST'),
        value: 'DoesNotExist',
      },
    ]
  }

  get severities() {
    return SEVERITY_LEVEL.map(item => ({
      label: t(item.label),
      value: item.value,
      level: item,
    }))
  }

  getInitialData() {
    const { key, operator, values } = this.props.value || {}

    return {
      key,
      operator,
      values,
      keyName: '',
      keyItems:
        key && isEmpty(this.keys.find(item => item.value === key))
          ? [...this.keys, { label: key, value: key }]
          : [...this.keys],
    }
  }

  handleNameChange = (e, keyName) => {
    this.setState({ keyName })
  }

  handleAddItem = () => {
    const { keyItems, keyName } = this.state
    if (!PATTERN_NAME.test(keyName)) {
      Notify.error({ content: t('PATTERN_NAME_INVALID_TIP') })
      return
    }
    this.setState({
      keyItems: [...keyItems, { label: keyName, value: keyName }],
      keyName: '',
    })
  }

  handleKeyChange = key => {
    this.setState({ key, values: [] }, () => this.handleChange())
  }

  handleOperatorChange = operator => {
    this.setState({ operator }, () => this.handleChange())
  }

  handleValueChange = values => {
    this.setState({ values }, () => this.handleChange())
  }

  handleChange = () => {
    const { key, operator, values } = this.state

    this.props.onChange({
      key,
      operator,
      values,
    })
  }

  dorpdownRender = options => {
    const { keyName } = this.state

    return (
      <div>
        {options}
        <div className={styles.customSelect}>
          <Input
            className={styles.customInput}
            value={keyName}
            onChange={this.handleNameChange}
          />
          <div className={styles.iconWrapper} onClick={this.handleAddItem}>
            <Icon name="add" type="light" size={12} />
          </div>
        </div>
      </div>
    )
  }

  renderValues() {
    const { key, operator, values } = this.state
    if (operator === 'Exists' || operator === 'DoesNotExist') {
      return null
    }
    if (key === 'severity') {
      return (
        <Select
          name="values"
          value={values}
          options={this.severities}
          multi
          onChange={this.handleValueChange}
          placeholder={t('VALUES')}
        />
      )
    }
    return (
      <TagInput
        name="values"
        placeholder={t('VALUES')}
        value={values}
        onChange={this.handleValueChange}
      />
    )
  }

  render() {
    const { key, operator, keyItems } = this.state

    return (
      <div className={styles.selectWrapper}>
        <Select
          name="key"
          value={key}
          options={keyItems}
          placeholder={t('LABEL')}
          onChange={this.handleKeyChange}
          dorpdownRender={this.dorpdownRender}
        />
        <Select
          name="operator"
          value={operator}
          options={this.operators}
          onChange={this.handleOperatorChange}
          placeholder={t('CONDITION_OPERATOR')}
        />
        {this.renderValues()}
      </div>
    )
  }
}
