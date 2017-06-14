let findDirectoriesDiff = (prevList, curList) => {
  let dirDiff = [];
  let fileDiff = {};
  Object.keys(prevList).forEach((p) => {
    if (!curList[p]) {
      dirDiff.push(' --- ' + p);
    } else {
      let result = _findFilesDiff(prevList[p], curList[p]);
      if (result.length) {
        fileDiff[p] = result;
      }
    }
  });
  Object.keys(curList).forEach((p) => {
    if (!prevList[p]) {
      dirDiff.push(' +++ ' + p);
    }
  });
  return {dirDiff, fileDiff};
};

let _findFilesDiff = (dirPrevList, dirCurList) => {
  let result = [];
  dirPrevList.forEach((p) => {
    if (dirCurList.find((i) => { return i === p; }) === undefined) {
      result.push(" --- " + p);
    }
  });
  dirCurList.forEach((c) => {
    if (dirPrevList.find((i) => { return i === c; }) === undefined) {
      result.push(" +++ " + c);
    }
  });
  return result;
};

module.exports = {
  findDirectoriesDiff,
};
