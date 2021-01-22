# Setup build matrix

This action helps build more complex GitHub Actions build matrices.

## Inputs

### `config`

**Required** Build matrix configuration.

## Outputs

### `matrix`

A build matrix to use in your jobs.

## Example usage

Use this action in a job and use its output as your build matrix.

```yaml
jobs:
  setup-build-matrix:
    runs-on: ubuntu-latest
    steps:
      - name: Build matrix
        id: build-matrix
        uses: jgiannuzzi/setup-build-matrix@v1
        with:
          config: |
            matrix:
              # Base matrix
              os: [ubuntu-latest, windows-latest]
              component: [backend, ui]
              dotnet: [3.1.405, 5.0.102]
            operations:
              # Do a database-style outer join to merge the 2 node versions
              # on matching component==ui keys.
              - type: merge
                match: [component]
                matrix:
                  component: [ui]
                  node: [14.15.4, 15.6.0]
              # Add an extra dotnet version just for ui on windows
              - type: add
                match: [os, component]
                matrix:
                  os: [windows-latest]
                  component: [ui]
                  dotnet: [4.7.2]
    outputs:
      matrix: ${{ steps.build-matrix.outputs.matrix }}

  build:
    needs: setup-build-matrix
    strategy:
      matrix: ${{ fromJson(needs.setup-build-matrix.outputs.matrix) }}
    runs-on: ${{ matrix.os }}
    steps:
      ...
```

The above workflow is equivalent to this:

```yaml
jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            component: backend
            dotnet: 3.1.405
          - os: ubuntu-latest
            component: backend
            dotnet: 5.0.102
          - os: ubuntu-latest
            component: ui
            dotnet: 3.1.405
            node: 14.15.4
          - os: ubuntu-latest
            component: ui
            dotnet: 3.1.405
            node: 15.6.0
          - os: ubuntu-latest
            component: ui
            dotnet: 5.0.102
            node: 14.15.4
          - os: ubuntu-latest
            component: ui
            dotnet: 5.0.102
            node: 15.6.0
          - os: windows-latest
            component: backend
            dotnet: 3.1.405
          - os: windows-latest
            component: backend
            dotnet: 5.0.102
          - os: windows-latest
            component: ui
            dotnet: 3.1.405
            node: 14.15.4
          - os: windows-latest
            component: ui
            dotnet: 3.1.405
            node: 15.6.0
          - os: windows-latest
            component: ui
            dotnet: 4.7.2
            node: 14.15.4
          - os: windows-latest
            component: ui
            dotnet: 4.7.2
            node: 15.6.0
          - os: windows-latest
            component: ui
            dotnet: 5.0.102
            node: 14.15.4
          - os: windows-latest
            component: ui
            dotnet: 5.0.102
            node: 15.6.0
    runs-on: ${{ matrix.os }}
    steps:
      ...
```

It can be helpful to visualize the operations that happened as actual matrices.

This is our initial matrix.

| os             | component | dotnet  |
| -------------- | --------- | ------- |
| ubuntu-latest  | backend   | 3.1.405 |
| ubuntu-latest  | backend   | 5.0.102 |
| ubuntu-latest  | ui        | 3.1.405 |
| ubuntu-latest  | ui        | 5.0.102 |
| windows-latest | backend   | 3.1.405 |
| windows-latest | backend   | 5.0.102 |
| windows-latest | ui        | 3.1.405 |
| windows-latest | ui        | 5.0.102 |

We start by doing a merge with the following matrix on the `component` column.

| component | node    |
| --------- | ------- |
| ui        | 14.15.4 |
| ui        | 15.6.0  |

This results in the following intermediate matrix.
Notice the new merged rows in bold that are replacing the previous `ui` rows.

| os                 | component | dotnet      | node        |
| ------------------ | --------- | ----------- | ----------- |
| ubuntu-latest      | backend   | 3.1.405     |             |
| ubuntu-latest      | backend   | 5.0.102     |             |
| **ubuntu-latest**  | **ui**    | **3.1.405** | **14.15.4** |
| **ubuntu-latest**  | **ui**    | **3.1.405** | **15.6.0**  |
| **ubuntu-latest**  | **ui**    | **5.0.102** | **14.15.4** |
| **ubuntu-latest**  | **ui**    | **5.0.102** | **15.6.0**  |
| windows-latest     | backend   | 3.1.405     |             |
| windows-latest     | backend   | 5.0.102     |             |
| **windows-latest** | **ui**    | **3.1.405** | **14.15.4** |
| **windows-latest** | **ui**    | **3.1.405** | **15.6.0**  |
| **windows-latest** | **ui**    | **5.0.102** | **14.15.4** |
| **windows-latest** | **ui**    | **5.0.102** | **15.6.0**  |

We then add the following matrix, matching on the `os` and `component` columns.

| os             | component | dotnet  |
| -------------- | --------- | ------- |
| windows-latest | ui        | 4.7.2   |

This results in the following final matrix.
Notice the 2 new added rows in bold.

| os                 | component | dotnet    | node        |
| ------------------ | --------- | --------- | ----------- |
| ubuntu-latest      | backend   | 3.1.405   |             |
| ubuntu-latest      | backend   | 5.0.102   |             |
| ubuntu-latest      | ui        | 3.1.405   | 14.15.4     |
| ubuntu-latest      | ui        | 3.1.405   | 15.6.0      |
| ubuntu-latest      | ui        | 5.0.102   | 14.15.4     |
| ubuntu-latest      | ui        | 5.0.102   | 15.6.0      |
| windows-latest     | backend   | 3.1.405   |             |
| windows-latest     | backend   | 5.0.102   |             |
| windows-latest     | ui        | 3.1.405   | 14.15.4     |
| windows-latest     | ui        | 3.1.405   | 15.6.0      |
| **windows-latest** | **ui**    | **4.7.2** | **14.15.4** |
| **windows-latest** | **ui**    | **4.7.2** | **15.6.0**  |
| windows-latest     | ui        | 5.0.102   | 14.15.4     |
| windows-latest     | ui        | 5.0.102   | 15.6.0      |

Note that the rows that have no values for a column will not have that key set at all in their resulting matrix object.
