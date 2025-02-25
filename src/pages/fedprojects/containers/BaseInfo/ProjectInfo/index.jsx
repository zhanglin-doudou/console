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
import { get, isEmpty } from 'lodash'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { Button, Icon, Menu, Dropdown } from '@kube-design/components'
import { getLocalTime, getDisplayName } from 'utils'
import { Panel } from 'components/Base'

import styles from './index.scss'

export default class ProjectInfo extends React.Component {
  renderMoreMenu() {
    const { actions, onMenuClick } = this.props

    return (
      <Menu onClick={onMenuClick}>
        {actions.map(action => (
          <Menu.MenuItem key={action.key}>
            <Icon name={action.icon} type="light" /> {action.text}
          </Menu.MenuItem>
        ))}
      </Menu>
    )
  }

  render() {
    const { detail, workspace, actions } = this.props
    return (
      <Panel className={styles.wrapper} title={t('PROJECT_INFO')}>
        <div className={styles.header}>
          <Icon name="project" size={40} />
          <div className={styles.item}>
            <div>{getDisplayName(detail)}</div>
            <p>{t('PROJECT_NAME')}</p>
          </div>
          <div className={styles.item}>
            <div>
              <Link to={`/workspaces/${workspace}`}>{workspace}</Link>
            </div>
            <p>{t('WORKSPACE')}</p>
          </div>
          <div className={styles.item}>
            <div>{get(detail, 'creator') || '-'}</div>
            <p>{t('CREATOR')}</p>
          </div>
          <div className={styles.item}>
            <div>
              {getLocalTime(detail.createTime).format(`YYYY-MM-DD HH:mm:ss`)}
            </div>
            <p>{t('CREATION_TIME')}</p>
          </div>
          {!isEmpty(actions) && (
            <div className={classNames(styles.item, 'text-right')}>
              <Dropdown
                theme="dark"
                content={this.renderMoreMenu()}
                trigger="click"
                placement="bottomRight"
              >
                <Button>{t('MANAGE_PROJECT')}</Button>
              </Dropdown>
            </div>
          )}
        </div>
      </Panel>
    )
  }
}
