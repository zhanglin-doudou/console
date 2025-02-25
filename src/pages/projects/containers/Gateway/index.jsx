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
import { observer, inject } from 'mobx-react'
import { trigger } from 'utils/action'
import Banner from 'components/Cards/Banner'

import GatewayCard from 'clusters/containers/Gateway/Components/GatewayCard'
import { Tooltip, Icon, Loading, Button, Alert } from '@kube-design/components'
import GatewayStore from 'stores/gateway'
import { observable } from 'mobx'
import { isEmpty } from 'lodash'

import styles from './index.scss'

@inject('rootStore')
@observer
@trigger
export default class Getway extends React.Component {
  store = new GatewayStore()

  @observable
  gatewayList = []

  @observable
  isLoading = false

  get cluster() {
    return this.props.match.params.cluster
  }

  get prefix() {
    return this.props.match.url
  }

  get enableActions() {
    return globals.app.getActions({
      module: 'project-settings',
      ...this.props.match.params,
      project: this.namespace,
    })
  }

  getHostGateway = () => {
    return this.store.getGateway({ cluster: this.cluster })
  }

  getProjectGateway = () => {
    const params = { ...this.props.match.params }
    return this.store.getGateway({ ...params, cluster: this.cluster })
  }

  getInitGateway = async () => {
    this.isLoading = true
    const dataList = await Promise.all([
      this.getHostGateway(),
      this.getProjectGateway(),
    ])
    this.gatewayList = dataList
    this.isLoading = false
  }

  componentDidMount() {
    this.getInitGateway()
  }

  renderClusterGatewayTitle = () => (
    <div className={styles.title}>
      <span> {t('CLUSTER_GATEWAY')}</span>
      <Tooltip content={t('CLUSTER_GATEWAY_GUIDE_DESC')} placement="top">
        <Icon name="question" size={20} />
      </Tooltip>
    </div>
  )

  renderProjectTitle = () => {
    return <div className={styles.title}>{t('PROJECT_GATEWAY')}</div>
  }

  renderOperations = ({ url, disabled }) => {
    return (
      <Button
        disabled={disabled}
        onClick={() => {
          this.props.rootStore.routing.push(url)
        }}
      >
        {t('VIEW_DETAILS')}
      </Button>
    )
  }

  renderGatewayCard = () => {
    return this.gatewayList.map((item, index) => {
      const isCluster = index === 0
      return item ? (
        <GatewayCard
          key={index}
          type={isCluster ? 'cluster' : 'project'}
          detail={item}
          actions={this.enableActions}
          {...this.props}
          store={this.store}
          getData={this.getInitGateway}
          title={
            isCluster
              ? this.renderClusterGatewayTitle()
              : this.renderProjectTitle()
          }
          prefix={isCluster ? null : this.prefix}
          renderOperations={isCluster ? this.renderOperations : null}
        />
      ) : null
    })
  }

  render() {
    const bothHasGateway =
      this.gatewayList.length && this.gatewayList.every(item => !isEmpty(item))
    return (
      <>
        <Banner
          icon="loadbalancer"
          title={t('GATEWAY_SETTINGS')}
          description={t('PROJECT_GATEWAY_DESC')}
          tabs={this.tabs}
        />
        <Loading spinning={this.isLoading}>
          <>
            {bothHasGateway ? (
              <Alert
                type="warning"
                message={t('PROJECT_GATEWAY_IP_TIP')}
                hideIcon
              />
            ) : null}
            {this.renderGatewayCard()}
          </>
        </Loading>
      </>
    )
  }
}
