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
import withList, { ListPage } from 'components/HOCs/withList'
import Table from 'components/Tables/List'

import PvStore from 'stores/pv'
import { getLocalTime } from 'utils'
import { getVolumeStatus } from 'utils/status'
import { PV_STATUS } from 'utils/constants'
import StatusReason from 'projects/components/StatusReason'

import { Avatar, Status } from 'components/Base'

@withList({
  store: new PvStore(),
  module: 'persistentvolumes',
  name: 'VOLUME_INSTANCE',
  rowKey: 'uid',
})
export default class PV extends React.Component {
  showAction = record => !record.isFedManaged

  cantDelete = record => record.status.phase === 'Bound'

  get itemActions() {
    const { trigger } = this.props

    return [
      {
        key: 'delete',
        icon: 'trash',
        text: t('DELETE'),
        action: 'delete',
        show: this.showAction,
        disabled: this.cantDelete,
        onClick: item =>
          trigger('pv.delete', {
            ...this.props.tableProps,
            detail: item,
            success: this.props.getData(),
          }),
      },
    ]
  }

  get tableActions() {
    const { trigger, tableProps } = this.props
    return {
      ...tableProps.tableActions,
      selectActions: [
        {
          key: 'delete',
          icon: 'trash',
          text: t('DELETE'),
          action: 'delete',
          type: 'danger',
          show: this.showAction,
          onClick: () =>
            trigger('pv.batch.delete', {
              ...this.props.tableProps,
            }),
        },
      ],
    }
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

  getCheckboxProps = record => ({
    disabled: record.isFedManaged || record.phase === 'Bound',
    name: record.name,
  })

  getStatus() {
    return PV_STATUS.map(status => ({
      text: t(status.text),
      value: status.value,
    }))
  }

  getColumns() {
    const { getSortOrder, getFilteredValue } = this.props
    const { cluster } = this.props.match.params

    return [
      {
        title: t('NAME'),
        dataIndex: 'name',
        sortOrder: getSortOrder('name'),
        search: true,
        sorter: true,
        render: (name, record) => {
          return (
            <Avatar
              icon={'storage'}
              iconSize={40}
              to={`/clusters/${cluster}/pv/${name}`}
              isMultiCluster={record.isFedManaged}
              desc={this.getItemDesc(record)}
              title={name}
            />
          )
        },
      },
      {
        title: t('STATUS'),
        dataIndex: 'status',
        isHideable: true,
        search: true,
        filters: this.getStatus(),
        filteredValue: getFilteredValue('status'),
        width: '10.56%',
        render: ({ phase }) => (
          <Status
            type={phase}
            name={t(`PV_STATUS_${phase.toUpperCase()}`)}
            flicker
          />
        ),
      },
      {
        title: t('CAPACITY'),
        dataIndex: 'capacity',
        isHideable: true,
        width: '7%',
        render: capacity => (
          <div>
            <p>{capacity}</p>
          </div>
        ),
      },
      {
        title: t('ACCESS_MODE_TCAP'),
        dataIndex: 'accessMode',
        isHideable: true,
        width: '12.32%',
        render: accessMode => (
          <div>
            <p>{accessMode}</p>
          </div>
        ),
      },
      {
        title: t('RECYCLING_STRATEGY'),
        dataIndex: '_originData',
        isHideable: true,
        width: '7.74%',
        render: _ => _.spec.persistentVolumeReclaimPolicy,
      },
      {
        title: t('BACKEND_IDENTIFIER'),
        dataIndex: 'volumeHandle',
        isHideable: true,
        width: '9.8%',
        render: volumeHandle => (
          <div>
            <p>{volumeHandle}</p>
          </div>
        ),
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

  render() {
    const { match, tableProps } = this.props
    return (
      <ListPage {...this.props}>
        <Table
          {...tableProps}
          itemActions={this.itemActions}
          tableActions={this.tableActions}
          columns={this.getColumns()}
          cluster={match.params.cluster}
          getCheckboxProps={this.getCheckboxProps}
          renderProjectSelect={false}
        />
      </ListPage>
    )
  }
}
