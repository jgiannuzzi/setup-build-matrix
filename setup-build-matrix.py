#!/usr/bin/env python3

import json
import os

import pandas as pd
import yaml


def load_matrix(data):
    return pd.DataFrame(
        index=pd.MultiIndex.from_product(
            data.values(),
            names=data.keys()
        )
    ).reset_index()


def main():
    config = yaml.safe_load(os.environ.get('INPUT_CONFIG'))

    matrix = load_matrix(config['matrix'])

    for op in config['operations']:
        op_matrix = load_matrix(op['matrix'])
        if op['type'] == 'merge':
            matrix = matrix.merge(op_matrix, on=op['match'], how='outer')
        elif op['type'] == 'add':
            intersection = matrix.columns.intersection(
                op_matrix.columns).difference(op['match'])
            matrix = matrix.append(matrix.drop(intersection, axis=1).merge(
                op_matrix, on=op['match'])).drop_duplicates()
        else:
            print(f'Unknown operation type {op["type"]}')

    matrix = matrix.sort_values(by=list(matrix.columns), ignore_index=True)
    include = matrix.to_dict(orient='records')
    for x in include:
        for k, v in tuple(x.items()):
            if pd.isnull(v):
                del x[k]
    print('::set-output name=matrix::' + json.dumps({'include': include}, separators=(',', ':')))


if __name__ == '__main__':
    main()
