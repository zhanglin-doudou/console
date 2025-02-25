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
import { isEmpty, get, isUndefined } from 'lodash'
import { observer, inject } from 'mobx-react'
import { Loading } from '@kube-design/components'

import { Status } from 'components/Base'
import { getDisplayName, getLocalTime } from 'utils'
import { trigger } from 'utils/action'
import { toJS } from 'mobx'
import Volume from 'stores/volume'
import StorageClass from 'stores/storageClass'

import DetailPage from 'projects/containers/Base/Detail'

import getRoutes from './routes'

@inject('rootStore')
@observer
@trigger
export default class VolumeDetail extends React.Component {
  store = new Volume()

  storageclass = new StorageClass()

  componentDidMount() {
    this.fetchData()
  }

  get name() {
    return 'VOLUME'
  }

  get module() {
    return 'volumes'
  }

  get authKey() {
    return 'volumes'
  }

  get listUrl() {
    const { isFedManaged } = toJS(this.store.detail)

    const { workspace, cluster, namespace } = this.props.match.params
    if (workspace) {
      if (isFedManaged) {
        return `/${workspace}/federatedprojects/${namespace}/${this.module}`
      }

      return `/${workspace}/clusters/${cluster}/projects/${namespace}/${this.module}`
    }
    return `/clusters/${cluster}/${this.module}`
  }

  get isFedManaged() {
    return this.store.detail.isFedManaged
  }

  get allowClone() {
    try {
      const clone = toJS(this.storageclass).detail.annotations[
        'storageclass.kubesphere.io/allow-clone'
      ]
      return isUndefined(clone) ? true : !JSON.parse(clone)
    } catch (err) {
      return true
    }
  }

  get allowSnapshot() {
    try {
      const snapShot = toJS(this.storageclass).detail.annotations[
        'storageclass.kubesphere.io/allow-snapshot'
      ]
      return isUndefined(snapShot) ? true : !JSON.parse(snapShot)
    } catch (err) {
      return true
    }
  }

  fetchData = async () => {
    const { cluster } = this.props.match.params
    await this.store.fetchDetail(this.props.match.params)

    const { storageClassName } = this.store.detail
    await this.storageclass.fetchDetail({
      cluster,
      name: storageClassName,
    })
    await this.store.getSnapshotType()
  }

  getOperations = () => [
    {
      key: 'edit',
      icon: 'pen',
      text: t('EDIT_INFORMATION'),
      action: 'edit',
      onClick: () =>
        this.trigger('resource.baseinfo.edit', {
          type: this.name,
          detail: toJS(this.store.detail),
          success: this.fetchData,
        }),
    },
    {
      key: 'editYaml',
      icon: 'pen',
      text: t('EDIT_YAML'),
      action: 'edit',
      onClick: () =>
        this.trigger('resource.yaml.edit', {
          detail: this.store.detail,
          success: this.fetchData,
        }),
    },
    {
      key: 'clone',
      type: 'control',
      text: t('CLONE_VOLUME'),
      icon: 'copy',
      action: 'create',
      disabled: this.allowClone,
      onClick: () => {
        this.trigger('volume.clone', {})
      },
    },
    {
      key: 'snapshot',
      type: 'control',
      text: t('CREATE_SNAPSHOT'),
      icon: 'copy',
      action: 'create',
      disabled: this.allowSnapshot,
      onClick: () => {
        this.trigger('volume.create.snapshot', {
          detail: this.store.detail,
        })
      },
    },
    {
      key: 'expand',
      text: t('EXPAND_VOLUME'),
      icon: 'scaling',
      action: 'edit',
      disabled: !get(this.storageclass.detail, 'allowVolumeExpansion', false),
      onClick: () => {
        const { detail, isSubmitting } = this.store
        const originData = toJS(detail._originData)
        const storageClassSizeConfig = this.storageclass.getStorageSizeConfig()

        this.trigger('volume.expand', {
          isExpanding: isSubmitting,
          shouldAlertVisible: detail.inUse,
          detail: originData,
          max: storageClassSizeConfig.max,
          min: storageClassSizeConfig.min,
          step: storageClassSizeConfig.step,
        })
      },
    },
    {
      key: 'delete',
      icon: 'trash',
      text: t('DELETE'),
      action: 'delete',
      type: 'danger',
      onClick: () =>
        this.trigger('resource.delete', {
          type: this.name,
          detail: toJS(this.store.detail),
          success: this.returnTolist,
        }),
    },
  ]

  getAttrs = () => {
    const { detail = {} } = this.store
    const {
      createTime,
      creator,
      phase,
      capacity,
      namespace,
      accessMode = '-',
    } = detail
    if (isEmpty(detail)) return null

    const storageClassName =
      detail.storageClassName ||
      get(detail, "annotations['volume.beta.kubernetes.io/storage-class']")

    return [
      {
        name: t('PROJECT'),
        value: namespace,
      },
      {
        name: t('STATUS'),
        value: (
          <div>
            <Status
              type={phase}
              name={t(`VOLUME_STATUS_${phase.toUpperCase()}`)}
            />
          </div>
        ),
      },
      {
        name: t('CAPACITY'),
        value: capacity,
      },
      {
        name: t('ACCESS_MODE_TCAP'),
        value: accessMode,
      },
      {
        name: t('Storage Class'),
        value: storageClassName,
      },
      {
        name: t('PROVISIONER'),
        value: get(
          detail,
          "annotations['volume.beta.kubernetes.io/storage-provisioner']",
          '-'
        ),
      },
      {
        name: t('VOLUME_BACKEND_TCAP'),
        value: get(detail, '_originData.spec.volumeName', ''),
      },
      {
        name: t('CREATION_TIME_TCAP'),
        value: getLocalTime(createTime).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        name: t('CREATOR'),
        value: creator,
      },
    ]
  }

  returnTolist = () => {
    this.props.rootStore.routing.push(this.listUrl)
  }

  render() {
    const stores = { detailStore: this.store }

    if (this.store.isLoading && !this.store.detail.name) {
      return <Loading className="ks-page-loading" />
    }

    const sideProps = {
      module: this.module,
      authKey: this.authKey,
      name: getDisplayName(this.store.detail),
      desc: this.store.detail.description,
      attrs: this.getAttrs(),
      operations: this.getOperations(),
      icon: 'storage',
      breadcrumbs: [
        {
          label: t('VOLUME_PL'),
          url: this.listUrl,
        },
      ],
    }

    return (
      <DetailPage
        stores={stores}
        {...sideProps}
        routes={getRoutes(this.props.match.path)}
      />
    )
  }
}
