const cartesian = require("fast-cartesian");
const core = require("@actions/core");
const pd = require("pandas-js");
const yaml = require("js-yaml");

function load_matrix(data) {
  let columns = Object.keys(data);
  return new pd.DataFrame(
    cartesian(Object.values(data)).map((row) =>
      Object.fromEntries(row.map((val, idx) => [columns[idx], val]))
    )
  );
}

function ordered_merge(left, right, on, how) {
  let columns = left.columns.concat(
    right.columns.filter((x) => !left.columns.includes(x))
  );
  return left.merge(right, on, how).get(columns);
}

function drop_duplicates(df) {
  return new pd.DataFrame(
    Array.from(
      new Set(Array.from(df).map((x) => JSON.stringify(Object.fromEntries(x))))
    ).map((x) => JSON.parse(x))
  );
}

function sort(df) {
  return new pd.DataFrame(
    Array.from(df).sort(function (a, b) {
      let x = Object.fromEntries(a);
      let y = Object.fromEntries(b);
      for (let i of df.columns) {
        if (x[i] === y[i]) continue;
        if (x[i] === null) return -1;
        if (y[i] === null) return 1;
        return x[i].localeCompare(y[i]);
      }
      return 0;
    })
  );
}

try {
  const config = yaml.load(core.getInput("config"));

  var matrix = load_matrix(config.matrix);
  core.debug(`Initial matrix:\n${matrix.toString()}`);

  for (let op of config.operations) {
    let op_matrix = load_matrix(op.matrix);
    core.debug(`Operation: ${op.type}`);
    core.debug(`Match: ${op.match}`);
    core.debug(`Matrix:\n${op_matrix.toString()}`);

    switch (op.type) {
      case "append":
        matrix = matrix.append(op_matrix);
        break;
      case "merge":
        matrix = ordered_merge(matrix, op_matrix, op.match, "outer");
        break;
      case "add":
        let diff = matrix.columns.filter((x) => !op_matrix.columns.includes(x));
        let selection = Array.from(new Set([...diff, ...op.match]));
        core.debug(`Selection: ${selection}`);
        let selected = matrix.get(selection);
        core.debug(`Selected:\n${selected.toString()}`);
        let merged = drop_duplicates(
          selected.merge(op_matrix, op.match).get(matrix.columns)
        );
        core.debug(`Merged:\n${merged.toString()}`);
        matrix = matrix.append(merged);
        break;
      default:
        core.warning(`Unknown operation type ${op.type}`);
    }
    core.debug(`Result:\n${matrix.toString()}`);
  }

  // sort the results
  matrix = sort(matrix);
  core.debug(`Sorted:\n${matrix.toString()}`);

  // output without nulls
  core.setOutput(
    "matrix",
    JSON.stringify({
      include: Array.from(matrix).map((row) =>
        Object.fromEntries(
          Array.from(row).map((x) => [x[0], x[1] === null ? undefined : x[1]])
        )
      ),
    })
  );
} catch (error) {
  core.setFailed(error.message);
}
