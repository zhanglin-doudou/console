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
 *
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import { isEmpty } from 'lodash'
import { withProjectList, ListPage } from 'components/HOCs/withList'
import Table from 'components/Tables/List'
import VolumeStore from 'stores/volume'
import { getLocalTime, getDisplayName } from 'utils'
import { getVolumeStatus } from 'utils/status'
import { VOLUME_STATUS } from 'utils/constants'
import StatusReason from 'projects/components/StatusReason'

import { Avatar, Status } from 'components/Base'

import Banner from 'components/Cards/Banner'

import styles from './index.scss'

@withProjectList({
  store: new VolumeStore(),
  module: 'persistentvolumeclaims',
  authKey: 'volumes',
  name: 'VOLUME',
  rowKey: 'uid',
})
export default class Volumes extends React.Component {
  get tips() {
    return [
      {
        title: t('WHAT_IS_STORAGE_CLASS_Q'),
        description: t('WHAT_IS_STORAGE_CLASS_A'),
      },
      {
        title: t('WHAT_IS_LOCAL_VOLUME_Q'),
        description: t('WHAT_IS_LOCAL_VOLUME_A'),
      },
    ]
  }

  get itemActions() {
    const { trigger, name } = this.props

    return [
      {
        key: 'edit',
        icon: 'pen',
        text: t('EDIT_INFORMATION'),
        action: 'edit',
        onClick: item =>
          trigger('resource.baseinfo.edit', {
            detail: item,
          }),
      },
      {
        key: 'editYaml',
        icon: 'pen',
        text: t('EDIT_YAML'),
        action: 'edit',
        onClick: item =>
          trigger('resource.yaml.edit', {
            detail: item,
          }),
      },
      {
        key: 'delete',
        icon: 'trash',
        text: t('DELETE'),
        action: 'delete',
        onClick: item =>
          trigger('resource.delete', {
            type: name,
            detail: item,
          }),
      },
    ]
  }

  getItemDesc = record => {
    const status = getVolumeStatus(record)
    const desc = !isEmpty(status) ? (
      <StatusReason reason={status} data={record} type={'volume'} />
    ) : (
      record.storageClassName || '-'
    )

    return desc
  }

  getStatus() {
    return VOLUME_STATUS.map(status => ({
      text: t(status.text),
      value: status.value,
    }))
  }

  getColumns() {
    const { getSortOrder, getFilteredValue } = this.props

    return [
      {
        title: t('NAME'),
        dataIndex: 'name',
        sortOrder: getSortOrder('name'),
        search: true,
        sorter: true,
        render: (name, record) => (
          <Avatar
            icon={'storage'}
            iconSize={40}
            to={`${this.props.match.url}/${name}`}
            desc={this.getItemDesc(record)}
            title={getDisplayName(record)}
          />
        ),
      },
      {
        title: t('STATUS'),
        dataIndex: 'status',
        isHideable: true,
        search: true,
        filters: this.getStatus(),
        filteredValue: getFilteredValue('status'),
        width: '10.6%',
        render: (_, { phase }) => (
          <Status
            type={phase}
            className={styles.status}
            name={t(`VOLUME_STATUS_${phase.toUpperCase()}`)}
            flicker
          />
        ),
      },
      {
        title: t('VOLUME_BACKEND_TCAP'),
        dataIndex: '_originData',
        isHideable: true,
        search: false,
        width: '28.5%',
        render: _ => _.spec.volumeName,
      },
      {
        title: t('ACCESS_MODE_TCAP'),
        dataIndex: 'capacity',
        isHideable: true,
        width: '12.3%',
        render: (capacity, { accessModes }) => (
          <div className={styles.capacity}>
            {accessModes.map(mode => (
              <p> {mode} </p>
            ))}
          </div>
        ),
      },
      {
        title: t('MOUNT_STATUS'),
        dataIndex: 'inUse',
        isHideable: true,
        width: '7.7%',
        render: inUse => (inUse ? t('MOUNTED') : t('NOT_MOUNTED')),
      },
      {
        title: t('CREATION_TIME_TCAP'),
        dataIndex: 'createTime',
        sorter: true,
        sortOrder: getSortOrder('createTime'),
        isHideable: true,
        width: 140,
        render: time => getLocalTime(time).format('YYYY-MM-DD HH:mm'),
      },
    ]
  }

  showCreate = () => {
    const { match, module, projectStore } = this.props
    return this.props.trigger('volume.create', {
      module,
      projectDetail: projectStore.detail,
      namespace: match.params.namespace,
      cluster: match.params.cluster,
    })
  }

  render() {
    const { query, match, bannerProps, tableProps } = this.props
    return (
      <ListPage {...this.props}>
        <Banner {...bannerProps} tips={this.tips} />
        <Table
          {...tableProps}
          itemActions={this.itemActions}
          namespace={query.namespace}
          columns={this.getColumns()}
          onCreate={this.showCreate}
          cluster={match.params.cluster}
        />
      </ListPage>
    )
  }
}
