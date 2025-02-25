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

module.exports = {
  connected: 'connected',
  COPY: 'Copy',
  'Copy Successfully': 'Copied successfully.',
  Disconnect: 'Disconnect',
  disconnected: 'disconnected',
  'Download File': 'Download File',
  'Kubeconfig File': 'Kubeconfig File',
  'KubeSphere Terminal': 'KubeSphere Terminal',
  'Launch kubectl': 'Launch kubectl',
  'Put this into': 'Put this into',

  KUBECONFIG_TIP: `
    <h2><a id="KubeConfig_Configuration_Method_0"></a>Configuration Method</h2>
    <p>For details about the parameters in the configuration file, see the <a href="https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/" target="_blank">official documentation</a>.</p>
  `,

  VIEW_KUBE_CONFIG:
    'Related operations of kubeConfig configuration include viewing and downloading',

  KUBECTL_TIP: `
    <h2><a id="KubeCtl_Common_Instructions_0"></a>Command Tips</h2>
    <p>For more information about kubectl, see the <a href="https://kubernetes.io/docs/reference/kubectl/overview/" target="_blank">official documentation</a>.</p>
    <h3><a id="kubectl_output_format_4"></a>Customize Output</h3>
    <ul>
    <li>View more information about a Pod.</li>
    </ul>
    <p><code>kubectl get pod &lt;pod-name&gt; -o wide</code></p>
    <ul>
    <li>View Pod details in YAML format.</li>
    </ul>
    <p><code>kubectl get pod &lt;pod-name&gt; -o yaml</code></p>
    <h3><a id="kubectl_Operation_14"></a>Perform Operations</h3>
    <h4><a id="1_Create_a_resource_object_16"></a>Create resources</h4>
    <ul>
    <li>Create a Service by using a YAML configuration file.</li>
    </ul>
    <p><code>kubectl create -f my-service.yaml</code></p>
    <ul>
    <li>Create resources by using all YAML, YML, and JSON files in a directory.</li>
    </ul>
    <p><code>kubectl create -f &lt;directory&gt;</code></p>
    <h4><a id="2_View_resource_objects_26"></a>View resources</h4>
    <ul>
    <li>View all Pods.</li>
    </ul>
    <p><code>kubectl get pods</code></p>
    <ul>
    <li>View all Services.</li>
    </ul>
    <p><code>kubectl get services</code></p>
    <h4><a id="3_View_resource_details_36"></a>View resource details.</h4>
    <ul>
    <li>View Node details.</li>
    </ul>
    <p><code>kubectl describe nodes &lt;node-name&gt;</code></p>
    <ul>
    <li>View Pod details.</li>
    </ul>
    <p><code>kubectl describe pods &lt;pod-name&gt;</code></p>
  `,
}
