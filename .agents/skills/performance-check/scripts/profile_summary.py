#!/usr/bin/env python3
"""Summarize `shopify theme profile` JSON (speedscope) files.

  profile_summary.py pages <dir> [file-substring ...]
      Median total render time per page, and the median inclusive time of each template file whose
      path contains one of the substrings (all files if none given, top 12).
  profile_summary.py lines '<glob>' <file-substring> [n]
      Median self time per Liquid line in matching files across the runs, top n (default 10).

Times are in milliseconds. Compare medians of 5+ runs; single profiles are noisy.
"""
import collections, glob, json, os, statistics, sys


def load(path):
    d = json.load(open(path))
    return d['shared']['frames'], d['profiles'][0]


def inclusive(path):
    """Total time and inclusive time per template file (outermost occurrence only)."""
    frames, p = load(path)
    incl, stack = collections.Counter(), []
    for e in p['events']:
        if e['type'] == 'O':
            stack.append((e['frame'], e['at']))
            continue
        fr, at = stack.pop()
        f = frames[fr]
        name, file = f['name'], f.get('file')
        outer = not any(frames[x[0]].get('file') == file and frames[x[0]]['name'] == name for x in stack)
        if file and name == 'liquid_template' and outer:
            incl[file] += e['at'] - at
    return (p['endValue'] - p['startValue']) / 1e6, {k: v / 1e6 for k, v in incl.items()}


def self_lines(path, match):
    frames, p = load(path)
    acc, stack = collections.Counter(), []
    for e in p['events']:
        if e['type'] == 'O':
            stack.append([e['frame'], e['at'], 0.0])
            continue
        fr, at, child = stack.pop()
        dur = e['at'] - at
        if stack:
            stack[-1][2] += dur
        f = frames[fr]
        if match in f.get('file', ''):
            acc[(f.get('file', '?').split('/')[-1], f.get('line'), f['name'])] += (dur - child) / 1e6
    return acc


def pages(directory, subs):
    names = sorted({os.path.basename(f).rsplit('.', 2)[0] for f in glob.glob(os.path.join(directory, '*.json'))})
    for name in names:
        totals, per = [], collections.defaultdict(list)
        runs = glob.glob(os.path.join(directory, name + '.*.json'))
        for f in runs:
            try:
                t, incl = inclusive(f)
            except (ValueError, KeyError, IndexError):
                continue
            totals.append(t)
            for k, v in incl.items():
                if not subs or any(s in k for s in subs):
                    per[k].append(v)
        if not totals:
            continue
        med = {k: statistics.median(v + [0] * (len(totals) - len(v))) for k, v in per.items()}
        top = sorted(med.items(), key=lambda x: -x[1])[: (None if subs else 12)]
        print(f'{name}  n={len(totals)}  total={statistics.median(totals):.1f} ms')
        for k, v in top:
            print(f'    {v:7.1f}  {k}')


def lines(pattern, match, n):
    runs = [self_lines(f, match) for f in glob.glob(pattern)]
    keys = set().union(*runs)
    med = {k: statistics.median([r.get(k, 0) for r in runs]) for k in keys}
    for (file, line, name), v in sorted(med.items(), key=lambda x: -x[1])[:n]:
        print(f'{v:6.2f} ms self  {file}:{line} {name}')


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'pages':
        pages(sys.argv[2], sys.argv[3:])
    elif len(sys.argv) >= 4 and sys.argv[1] == 'lines':
        lines(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 10)
    else:
        sys.exit(__doc__)
