#!/usr/bin/env python3
"""Cleanse corpus/the_yi_king.txt (OCR scan of the Dover 1963 republication
of Legge 1882 SBE XVI) into the markdown book proper.

Publisher advertising, catalogue matter, running heads, folios, gathering
signatures, and punctuation dust are stripped; two-band SBE pages (12pt
translation above, 9pt commentary/footnotes below) are separated before page
rejoining so notes never splice mid-sentence into text; broken soft-hyphen and
line-wrap splits are rejoined using internal concordance evidence; and the
structure of the book (Contents, Preface, Introduction, THE TEXT, THE
APPENDIXES I–VII) is rebuilt. Canonical hexagram names: corpus/legge-1882.json.

Usage: python3 clean_yi_king.py <raw.txt> <legge-1882.json> <out.md>
"""
import collections
import re
import sys
import json

SRC, JSON_PATH, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
raw = open(SRC, encoding='utf-8', errors='replace').read().split('\n')
N = len(raw)
data = json.load(open(JSON_PATH, encoding='utf-8'))
HEX = data['hexagrams'] if isinstance(data, dict) and 'hexagrams' in data else data
assert len(HEX) == 64
SOFT = '\u00ac'

Rn = {'I': 1, 'V': 5, 'X': 10, 'L': 50}


def roman_val(s):
    if not s or any(c not in Rn for c in s):
        return None
    n = prev = 0
    for c in reversed(s):
        v = Rn[c]
        n += v if v >= prev else -v
        prev = max(prev, v)
    return n


def roman_num(n):
    tbl = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'),
           (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    s = ''
    for v, sm in tbl:
        while n >= v:
            s += sm
            n -= v
    return s


# ------------------------------------------------------------------ internal concordance
WORD_FREQ = collections.Counter()
HYPH_FREQ = collections.Counter()
for _ln in raw[436:24260]:
    _toks = _ln.replace(SOFT, '').split()
    for _t in _toks[1:-1]:
        _c = _t.strip(".,;:!?'\"‘’“”()[]{}")
        if re.fullmatch(r'[A-Za-z]{2,}', _c):
            WORD_FREQ[_c.lower()] += 1
        elif re.fullmatch(r'[A-Za-z]{2,}-[A-Za-z]{2,}', _c):
            HYPH_FREQ[_c.lower()] += 1


def join_wrapped_pair(left, right, had_sh):
    """Join two line/page fragments, repairing soft-hyphens and internal-evidence wraps."""
    left = left.rstrip()
    right = right.lstrip()
    if not left:
        return right
    if not right:
        return left

    m_l_hy = re.search(r'([A-Za-z]{2,})-$', left)
    m_l_wd = re.search(r'([A-Za-z]{2,})$', left)
    m_r_wd = re.match(r'^([a-z]{2,})\b', right)

    if had_sh:
        if m_l_hy and m_r_wd:
            w1, w2 = m_l_hy.group(1), m_r_wd.group(1)
            comp = f'{w1}-{w2}'.lower()
            joined = f'{w1}{w2}'.lower()
            if HYPH_FREQ[comp] > WORD_FREQ[joined]:
                return left + right
            return left[:-1] + right
        if m_l_wd and m_r_wd:
            w1, w2 = m_l_wd.group(1), m_r_wd.group(1)
            comp = f'{w1}-{w2}'.lower()
            joined = f'{w1}{w2}'.lower()
            if HYPH_FREQ[comp] >= 2 and HYPH_FREQ[comp] > WORD_FREQ[joined]:
                return left + '-' + right
        return left + right

    if m_l_hy and m_r_wd:
        w1, w2 = m_l_hy.group(1), m_r_wd.group(1)
        comp = f'{w1}-{w2}'.lower()
        joined = f'{w1}{w2}'.lower()
        if WORD_FREQ[joined] >= 1 and HYPH_FREQ[comp] == 0:
            return left[:-1] + right
        return left + right

    if m_l_wd and m_r_wd and left[-1].islower():
        w1, w2 = m_l_wd.group(1), m_r_wd.group(1)
        joined = f'{w1}{w2}'.lower()
        if len(joined) >= 6 and WORD_FREQ[joined] >= 3 and (
            WORD_FREQ[w1.lower()] == 0 or WORD_FREQ[w2.lower()] == 0
        ):
            return left + right

    return left + ' ' + right


# ------------------------------------------------------------------ boundaries (0-based)
def find_exact(pat, start=0, end=None):
    for i in range(start, N if end is None else end):
        if re.fullmatch(pat, raw[i].strip()):
            return i
    raise RuntimeError(f'boundary {pat!r} not found from {start}')


def next_nonblank(idx):
    k = idx + 1
    while k < N and not raw[k].strip():
        k += 1
    return ' '.join(raw[k].split()) if k < N else ''


i_pre = next(i for i in range(400, 500) if raw[i].strip() == 'PREFACE.' and 'wrote out a translation' in next_nonblank(i))
i_intro = next(i for i in range(850, 900) if raw[i].strip() == 'INTRODUCTION.' and next_nonblank(i).startswith('Chapter'))

i_text = find_exact(r'^TEXT[.,]\s*SECTION\s+I\.?$', 4000, 4500)
i_text2 = find_exact(r'^TEXT[.,]\s*SECTION\s+II\.?$', i_text + 10, 8000)
_d1 = find_exact(r'^THE\s+APPENDIXES\.?$', 12000, 12300)
i_app = find_exact(r'^THE\s+APPENDIXES\.$', _d1 + 1, _d1 + 20)

i_a1 = find_exact(r'^APPENDIX\s+I\.$', i_app, i_app + 30)
i_a2 = next(i for i in range(14990, 15030) if re.fullmatch(r'APPENDIX\s+II\.', raw[i].strip())
            and 'Treatise on the Symbolism' in next_nonblank(i))
i_a3 = next(i for i in range(19425, 19450) if re.fullmatch(r'APPENDIX\s+III\.', raw[i].strip())
            and 'The Great Appendix' in next_nonblank(i))
i_a4 = next(i for i in range(22495, 22520) if re.fullmatch(r'APPENDIX\s+IV\.', raw[i].strip())
            and 'Supplementary' in next_nonblank(i))
i_a5 = next(i for i in range(23200, 23225) if re.fullmatch(r'A\s*P\s*P\s*E\s*N\s*D\s*I\s*X\s+V\.', raw[i].strip()))
i_a6 = next(i for i in range(23735, 23760) if re.fullmatch(r'APPENDIX\s+VI\.', raw[i].strip())
            and 'Orderly Sequence' in next_nonblank(i))
i_a7 = next(i for i in range(24075, 24095) if re.fullmatch(r'APPENDIX\s+VII\.', raw[i].strip())
            and 'taken promiscuously' in next_nonblank(i))
i_translit = next(k for k in range(i_a7, N) if raw[k].strip().startswith('Transliteration'))

HX = []
_want = 1
for i in range(i_text, i_app - 2):
    if _want > 64:
        break
    ln = raw[i]
    if not (ln.strip() and ln[0] in 'IVXL'):
        continue
    if raw[i - 1].strip() or raw[i + 1].strip():
        s2 = ''.join(ln.split())
        if not (re.search(r'Hexag[rai]?a?m', s2) and re.match(r"^L?[IVX]{1,7}[,.']", s2)):
            continue
    s = ''.join(ln.split())
    if not re.search(r'Hexag[rai]?a?m', s):
        continue
    m = re.match(r'^([IVXL]{1,8})[,.]', s) or re.match(r'^(I)[,.]1?[,.]?', s)
    matched = bool(m and roman_val(m.group(1)) == _want)
    if not matched and _want == 1:
        matched = bool(re.match(r"^(I)[,.']{1,2}", s))
    if not matched and _want > 1:
        m2 = re.match(r'^([IVXL]{1,8})1[,.]', s)
        if m2 and roman_val(m2.group(1)) == _want - 1:
            matched = True
    if matched:
        HX.append(i)
        _want += 1
assert len(HX) == 64, f'heading walk got {len(HX)} of 64'
HX_SET = {idx: n + 1 for n, idx in enumerate(HX)}


# ------------------------------------------------------------------ running heads & furniture
_FUSED_HEAD_RES = [
    re.compile(r'(?:(?<=\s)|^)[xvli]{2,6}\s+PREFACE[.,]?(?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)PREFACE[.,]\s*(?:[xvliXVL]{1,5}(?:\s*1)?|\d{1,2})(?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)(?:\d{1,3}\s+)?CH(?:AP)?[.,]?\s*(?:[IVX123nli]{1,4}|in|ii|ill|IN|HI)[.,]?\s*(?:\u2022\s*)?INTRODUCTION[.,]?(?:\s*\d{1,3}(?!\.\s))?(?=\s|$)'),
    re.compile(r'^(?:CH[.,]\s*(?:11|ii|ill|IN|HI|Ill|n)[.,]?)\s+(?=[a-z\u2018\'\u201c"])'),
    re.compile(
        r'(?:(?<=\s)|^)(?:(?:S[EFW][\'.]?[CT1LX]{1,3}|sser|sect)[.,]?\s*[I12nVXl]+\.?\s*)?'
        r'(?:THE|TIIE|TI-IE|TUI[\', ]+)\s+[A-Za-z0-9\'\u2019<>£$,.\s]{1,24}?'
        r'(?:HEX\s*A[GOU]|HEY\s*AUR)[ER\s]*A?M[.,]?'
        r'(?:\s+(?:1\s+\d\d|I\d\d|Ill|10\$|\d{2,3})\s*(?:\u2022\s*)?)?(?=\s|$)'
    ),
    re.compile(r'(?:(?<=\s)|^)SECT\.?\s*I+V?\.\s*the\s+[a-z ]{2,16}\s+hexagram\.(?:\s*\d{1,3}(?!\.\s))?(?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)(?:\d{1,3}\s+)?(?:THE|TIIE|TI-IE)\s+[VYvy]\s*[I1ltf$!]\s+(?:K[I1NGCTYo]{2,4}|IC?[TI]NG)[.,](?:\s*(?:TEXT\.|\d{1,3}(?!\.\s)))?(?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)the\s+y!\s+kino\.(?=\s|$)', re.I),
    re.compile(r'(?:(?<=\s)|^)(?:\d{1,3}\s+)?(?:THE|TIIE|TI-IE|the)\s+(?:APPENDIX(?:ES|E|C)?|appendixes)[.,](?:\s*(?:SECT|CHAP|sect)[.,]?\s*[IVX12nirIT\d]+[.,]?)?(?:\s*\d{1,3}(?!\.\s))?(?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)(?:HEX|CHAP|SECT)[.,]\s*[IVX0-9]{1,4}[.,]\s*APPENDIX\s+[IVXLC1TIH]+[.,]?(?:\s*\d{1,3}(?!\.\s))?(?=\s|$)', re.I),
    re.compile(r'(?:(?<=\s)|^)(?:SECT|CHAP)[.,]\s*(?:ir|r|IT|If|M|n)[.,](?=\s|$)'),
    re.compile(r'(?:(?<=\s)|^)CHAP\.\s*\d+\.\s*\]\s*CHAP\.\s*\d+\.(?=\s|$)'),
]

_INTRO_MARGIN_PREFIXES = [
    (re.compile(r'^The\s+second\s+(?=figures\b)'), ''),
    (re.compile(r'^Appendix\.\s+pished\b'), 'plished'),
    (re.compile(r'^The\s+Great\s+(?=by\s+a\s+repetition\b)'), ''),
    (re.compile(r'^Symbolism\.\s+(?=represent)'), ''),
    (re.compile(r'^The\s+sixth\s+(?=than\s+once\b)'), ''),
    (re.compile(r'^The\s+first\s+(?=to\s+paragraphs\b)'), ''),
    (re.compile(r'\bThe\s+first\s+(?=to\s+paragraphs,\s+in\s+which\s+Wan\b)'), ''),
    (re.compile(r'^Confucius,\s+(?=come\s+down\s+to\s+us\b)'), ''),
    (re.compile(r'^and\s+when\s+it\s+0f\s+the\s+ancient\b'), 'of the ancient'),
    (re.compile(r'^The\s+Text\s+(?=Text\s+is\s+than\s+the\s+Appendixes\b)'), ''),
    (re.compile(r'^Labours\s+of\s+(?=the\s+Appendixes\s*;)', re.I), ''),
    (re.compile(r'^An\s+imperfect\s+(?=have\s+accomplished\b)'), 'they '),
    (re.compile(r'^description\s+of\s+(?=been\s+done\s+lately\b)'), ''),
    (re.compile(r'^their\s+labours\.\s*\u2022?\s*(?=tke\s+foremost\b)'), ''),
    (re.compile(r'^Erroneous\s+0f\s+European\b'), 'of European'),
    (re.compile(r'^account\s+of\s+tile[.,\s>]*$'), ''),
    (re.compile(r'^labours\s+of\s+(?=translations\s+of\s+the\s+Yi\b)'), ''),
    (re.compile(r'^scholars[.,]\s+(?=shows\s+how\s+imperfectly\b)'), ''),
]


def clean_line_text(i, in_intro=False):
    raw_ln = raw[i]
    had_sh = raw_ln.rstrip().endswith(SOFT)
    s = ' '.join(raw_ln.replace(SOFT, '').split())
    if not s or i in HX_SET:
        return s, had_sh
    for rx in _FUSED_HEAD_RES:
        s = rx.sub(' ', s)
    if in_intro:
        for rx, rep in _INTRO_MARGIN_PREFIXES:
            s = rx.sub(rep, s)
    s = re.sub(r'\s+[|¦]$', '', s)
    if 9000 <= i <= 11200:
        s = re.sub(r'(?<=[a-z.,;:\-\)])\s+j$', '', s)
    s = ' '.join(s.split())
    return s, had_sh


def is_furniture(i, in_intro=False):
    if i in HX_SET:
        return False
    t, _ = clean_line_text(i, in_intro=in_intro)
    if not t:
        return True
    if re.match(r'^(?:Chapter\s+[IVX0-9]+\b|Section\s+[IVX12]+\b|The\s+Great\s+Appendix\b|PLATE\s+[IVX]+\.?$)', t):
        return False
    if re.fullmatch(r'TEXT[.,]\s*SECTION\s+[IVX]+\.?', t, re.I):
        return True
    if re.fullmatch(r'[\dIVXLC\^><\u00bb,.:\-*°\u2022\u00a7\u25a0\u25cf\'’"`|/\\()\[\]_~=+\s]{1,12}', t):
        if not raw[i - 1].strip() and (i + 1 >= N or not raw[i + 1].strip()):
            return True
        if not re.search(r'[A-Za-z]{2}', t):
            return True
    if re.fullmatch(r'(?:\d\s*\d{1,2}|6o|43\^|\^5|4\*7|10\$|I[l0-9]\d)', t):
        return True
    if re.fullmatch(r'[\u2014\-*.\s]{5,}', t):
        return True
    if re.fullmatch(r'(?:\[\d+\]\s*)?[A-Za-z]\s+[a-z](?:\s*\d)?|[A-Z]\s*\d', t):
        return True
    if len(t) <= 16 and not re.search(r'[A-Za-z]{2}', t):
        return True
    u = t.upper()
    if re.fullmatch(r'(?:THE\s+|TIIE\s+|TI-IE\s+|TEH\s+)?(?:Y\s*[I1LTF$!V]\s*K[I1NGCTYo]{2,4}|IC?[TI]NG)[.,!\s\d]*(?:TEXT\.)?', u):
        return True
    if re.fullmatch(r'PREFACE[.,!\s\dIVXL]*|[IVXL\d\s]+PREFACE[.,!]?', u):
        return True
    if re.fullmatch(r'CONTENTS?[.,!\s\dIVXL]*', u):
        return True
    if re.fullmatch(r'(?:CH(?:AP)?[.,\s]*[IVX0-9A-Z]{0,4}[.,\s]*)?INT[RB]ODUCT[A-Z]*[.,!\s\d]*', u):
        return True
    if re.fullmatch(r'(?:I?\d{2,3}\s+)?(?:T[EF\.I:]{1,3}[XKV][TRK]?|TXTK?R?|TO/)[.,!\s]*(?:(?:SECT?|SF\.?C?T)[.,!\s]*[IVX12l]+[.,!\s]*)?\d*', u):
        return True
    if re.fullmatch(r'(?:\d[0-9io]{1,2}\s+)?(?:S[EFW][\'.]?[CT1LX]{1,3}|SECT(?:ION)?)[.,\s]*(?:[IVX12lnr!MT]{1,3}|IF|IR)[.,\s]*(?:R|\d*)', u):
        return True
    if re.fullmatch(r'CH(?:AP)?[.,]?\s*(?:[IVX0-9]{1,4}|IN|II|ILL|HI|N|R)[.,]?', u):
        return True
    if re.fullmatch(r'(?:THE\s+|TIIE\s+|TI-IE\s+|TEH\s+)?A\s*P+\s*E\s*N\s*D\s*I\s*X(?:ES|E|C)?[.,!\s]*(?:(?:SECT?|CHAP)[.,\s]*[IVX0-9]+[.,\s]*)?\d*', u):
        return True
    if re.fullmatch(r'(?:(?:I\s+)?HEX[.,]?\s*[0-9IVX]*[.,)]*\s*|CHAP[.,]?\s*[0-9IVX]+[.,]?\s*)?(?:A\s*P+\s*E\s*N\s*D\s*I\s*X\s+[IVXLC1TIYH]{1,4}[.,!\s]*(?:SECT[.,\s]*[A-Z0-9.]+)?|HEX[.,]?\s*(?:[A-Z0-9]{0,3}[.,)]*))\s*[\d^]*', u):
        return True
    alpha = sum(c.isalpha() for c in t)
    caps = sum(c.isupper() for c in t)
    if alpha and caps >= 0.6 * alpha and re.search(r'(?:HEX\s*A[GOU]|HEY\s*AUR)[ER\s]*A?M', u) and len(t) <= 55:
        return True
    return False


# ------------------------------------------------------------------ block & paragraph joining
def join_raw_lines(line_idxs, in_intro=False):
    acc = ''
    prev_sh = False
    for idx in line_idxs:
        ln, sh = clean_line_text(idx, in_intro=in_intro)
        if not ln:
            continue
        if not acc:
            acc = ln
        else:
            acc = join_wrapped_pair(acc, ln, prev_sh)
        prev_sh = sh
    return acc.strip(), prev_sh


_FRESH_STRUCT_RX = re.compile(
    r'^(?:#|\*\*Chapter\b|_Explanation\b|PLATE\s+[IVX]+|'
    r'\d{1,2}(?:-\d{1,2}|,\s*\d{1,2})?\.\s+\S|'
    r'\([ivx1-9a-z]+\)\s+[A-Z\u2018\'(]|'
    r'[IVXL]{1,8}\.\s+[A-Z\u2018\'"(/13])'
)
_ABBR_END_RX = re.compile(r'\b(?:p|pp|vol|ch|chap|sect|par|parr|fig|no|vs|dr|mr|rev|st|b\.c|a\.d|[A-Z])\.$', re.I)
_TERM_PUNCT_RX = re.compile(r'[.!?:;]\s*[\u2019\'"\)\]\d]*$|\u2014$')


def rejoin_stream(items):
    out = []
    for item in items:
        txt, sh = item[0].strip(), item[1]
        if not txt:
            continue
        if not out:
            out.append([txt, sh])
            continue
        prev_txt, prev_sh = out[-1]

        if _FRESH_STRUCT_RX.match(txt) and not prev_sh:
            if not re.search(r'\b(?:by|of|in|to|and|or|the|a|an|with|from|into|under|that|is|are|was|were|be|no)\s*$', prev_txt):
                out.append([txt, sh])
                continue

        if prev_sh:
            out[-1] = [join_wrapped_pair(prev_txt, txt, True), sh]
            continue

        if re.match(r'^[a-z,\.;:!?\)\]]', txt):
            out[-1] = [join_wrapped_pair(prev_txt, txt, False), sh]
            continue

        if _ABBR_END_RX.search(prev_txt) and re.match(r'^[0-9a-z(]', txt):
            out[-1] = [join_wrapped_pair(prev_txt, txt, False), sh]
            continue

        if not _TERM_PUNCT_RX.search(prev_txt):
            if prev_txt.endswith(','):
                if len(prev_txt) < 65 or re.search(r'\b(?:hexagram|trigrams?|water, and|sky, and|namely|that is|says|said),\s*$', prev_txt, re.I):
                    out[-1] = [join_wrapped_pair(prev_txt, txt, False), sh]
                    continue
                out.append([txt, sh])
                continue
            out[-1] = [join_wrapped_pair(prev_txt, txt, False), sh]
            continue

        out.append([txt, sh])
    return [x[0] for x in out]


# ------------------------------------------------------------------ conservative polish
_OPEN_Q1_RES = [
    re.compile(r'(\b(?:of|for|or|called|as|gives|meaning|said|says|translate|into|between|phrase|term|words)\s+)1\s+(?=[A-Za-z][^‘’\n]{1,75}’)'),
    re.compile(r'([,:;\u2014/]\s*)1\s+(?=(?:the|a|an|in|to|it|he|we|not|gods|third|1\s+like)\b[^‘’\n]{1,90}’)', re.I),
]


def polish(p):
    if not p:
        return ''
    p = p.replace(SOFT, '')
    p = re.sub(r'(?<=[a-z])- (?=[a-z])', '-', p)
    p = re.sub(r'(?<![\d.\w])(\d) (?=\d{3}(?=[,.;:]?(\s|$)| [a-z]))', r'\1', p)
    p = re.sub(r'\s+([,.;:!?])', r'\1', p)
    p = re.sub(r'\s+\u2019(?![A-Za-z])', '\u2019', p)
    p = re.sub(r'\(\s+', '(', p)
    p = re.sub(r'\s+\)', ')', p)
    p = p.replace('1 1 like it;', '‘I like it;')
    for rx in _OPEN_Q1_RES:
        p = rx.sub(r'\1‘', p)
    p = re.sub(
        r'([‘\'][^‘’\'\n]{1,120}?[a-z0-9])/(?=\s+([A-Za-z(\u2018‘])|\s*$)',
        lambda m: m.group(1) + ('.’' if not m.group(2) or (m.group(2)[0].isupper() and m.group(2) not in ('I',)) else ',’'),
        p,
    )
    p = re.sub(r'(?:(?<=^)|(?<=[.!?]\s)|(?<=^\d\.\s))(?:I\s+he|1\s+he|Ihe)(?=\s+[a-z])', 'The', p)
    p = re.sub(r'(?:I\s+he|1\s+he|Ihe)(?=\s+(?:first|second|third|fourth|fifth|sixth|topmost)\s+line\b)', 'The', p)
    p = re.sub(r'\btri\s+grams\b', 'trigrams', p)
    p = re.sub(r'^i\.\s+(?=Two\s+things\s+have\s+to\s+be\s+considered)', '1. ', p)
    p = p.replace(
        "'afterM^^^^^^&ale anc' female. From the exis^J^^^^d female there came afterwards husband ajK|j|jj|.",
        "afterwards came male and female. From the existence of male and female there came afterwards husband and wife.",
    )
    p = re.sub(r'\s+', ' ', p).strip()
    return p


# ------------------------------------------------------------------ raw block builder
def raw_blocks(start, end, in_intro=False):
    blocks = []
    cur = []
    saw_furn = False
    for i in range(start, end):
        if not raw[i].strip():
            if cur:
                blocks.append((cur, saw_furn))
                cur = []
                saw_furn = False
            continue
        if is_furniture(i, in_intro=in_intro):
            if cur:
                blocks.append((cur, saw_furn))
                cur = []
            saw_furn = True
            continue
        if i in HX_SET:
            if cur:
                blocks.append((cur, saw_furn))
                cur = []
            blocks.append(([i], True))
            saw_furn = False
            continue
        cur.append(i)
    if cur:
        blocks.append((cur, saw_furn))
    return blocks


def block_metrics(idxs, in_intro=False):
    lns = [clean_line_text(k, in_intro=in_intro)[0] for k in idxs]
    lns = [x for x in lns if x]
    if not lns:
        return 0, 0.0, 0, ''
    if len(lns) == 1:
        return 1, float(len(lns[0])), len(lns[0]), lns[0]
    non_last = [len(x) for x in lns[:-1]]
    return len(lns), sum(non_last) / len(non_last), max(non_last), lns[0]


# ------------------------------------------------------------------ Preface & Introduction
def build_prose_with_footnotes(start, end, in_intro=False):
    rbs = raw_blocks(start, end, in_intro=in_intro)
    pages = [[]]
    cur_p = []
    last_end = start
    for idxs, _ in rbs:
        had_page_break = any(raw[k].strip() and is_furniture(k, in_intro=in_intro)
                             for k in range(last_end, idxs[0]))
        if had_page_break and cur_p:
            pages.append(cur_p)
            cur_p = []
        cur_p.append(idxs)
        last_end = idxs[-1] + 1
    if cur_p:
        pages.append(cur_p)
    pages = [pg for pg in pages if pg]

    body_items = []
    fn_by_page = collections.defaultdict(list)

    fn_start_rx = re.compile(
        r'^(?:[1-9*§■J]\s+(?:See\b|Conf[nu]cian\b|Analects\b|The\s+(?:Historical|Sh[fiu])\b|'
        r'Legge\b|Books\s+of\b|That\s+is\b|P\.\s*(?:Regis|Couplet|Visdelou)\b|'
        r'E[.,]\s*g\b|Sze-ma\b|It\s+has\s+been\s+suggested\b|Regis[\u2019\']\s+coadjutors\b|'
        r'Mayers\b|Biot\b|Syllabic\b)|'
        r'\*\s+[A-Z]|■\s+The\b)'
    )

    for p_idx, pg in enumerate(pages):
        in_fn = False
        for idxs in pg:
            cnt, avg, mx, s0 = block_metrics(idxs, in_intro=in_intro)
            if not s0:
                continue
            if in_intro and not in_fn:
                if (cnt >= 2 and (avg >= 67.5 or mx >= 72)) or (cnt == 1 and len(s0) >= 70) or fn_start_rx.match(s0):
                    if not s0.startswith('1 Was it not in the last age'):
                        in_fn = True
            txt, sh = join_raw_lines(idxs, in_intro=in_intro)
            if not txt:
                continue
            if in_fn:
                fn_by_page[p_idx].append((txt, sh))
            else:
                body_items.append((txt, sh, p_idx))

    rejoined_body = []
    for txt, sh, p_idx in body_items:
        if not rejoined_body:
            rejoined_body.append([txt, sh, {p_idx}])
            continue
        prev_txt, prev_sh, prev_pages = rejoined_body[-1]
        merged = rejoin_stream([(prev_txt, prev_sh), (txt, sh)])
        if len(merged) == 1:
            rejoined_body[-1] = [merged[0], sh, prev_pages | {p_idx}]
        else:
            rejoined_body.append([txt, sh, {p_idx}])

    out_paras = []
    emitted_fn_pages = set()
    for b_idx, (b_txt, _, b_pages) in enumerate(rejoined_body):
        out_paras.append(polish(b_txt))
        next_pages = rejoined_body[b_idx + 1][2] if b_idx + 1 < len(rejoined_body) else set()
        for pg_no in sorted(b_pages):
            if pg_no not in next_pages and pg_no not in emitted_fn_pages and pg_no in fn_by_page:
                emitted_fn_pages.add(pg_no)
                for fn_p in rejoin_stream(fn_by_page[pg_no]):
                    out_paras.append('> *Note:* ' + polish(fn_p))
    for pg_no in sorted(fn_by_page):
        if pg_no not in emitted_fn_pages:
            for fn_p in rejoin_stream(fn_by_page[pg_no]):
                out_paras.append('> *Note:* ' + polish(fn_p))
    return [p for p in out_paras if p]


# ------------------------------------------------------------------ THE TEXT (64 Hexagrams)
NOTE_STARTS = {1: 4251, 14: 5864, 22: 6697}
for _n in range(2, 65):
    if _n in NOTE_STARTS:
        continue
    _lo = HX[_n - 1]
    _hi = (HX[_n] + 60) if _n < 64 else i_app
    for _i in range(_lo + 3, min(_hi, N)):
        if raw[_i - 1].strip():
            continue
        _s = ' '.join(raw[_i].replace(SOFT, '').split())
        _m = re.match(r'^[^A-Za-z0-9]{0,3}([IVXL1l ]{1,10})[.,]\s+\S', _s)
        if _m and _i not in HX_SET:
            _tok = re.sub(r'\s+', '', _m.group(1)).replace('1', 'I').replace('l', 'I')
            if roman_val(_tok) == _n:
                NOTE_STARTS[_n] = _i
                break
assert len(NOTE_STARTS) == 64, f'got {len(NOTE_STARTS)} note starts'
_NOTE_START_SORTED = sorted((line_idx, hex_no) for hex_no, line_idx in NOTE_STARTS.items())


def note_owner_hex(raw_line_idx):
    owner = 1
    for ln_idx, h_no in _NOTE_START_SORTED:
        if raw_line_idx >= ln_idx:
            owner = h_no
        else:
            break
    return owner


_ORD_WORD_TO_NUM = {
    'first': '1', 'lowest': '1',
    'second': '2',
    'third': '3',
    'fourth': '4',
    'fifth': '5',
    'sixth': '6', 'topmost': '6',
}

_DUKE_LINE_SPLIT_RX = re.compile(
    r'(?:(?<=^)|(?<=[\s.)]))'
    r'(?:'
    r'(?:[1-7Iibr>]{1,2}[.,\'\-*]{1,2}\s*|,L\s*|[1-7]\s+[.,]\s*)'
    r'(?:In\s+the|The|From\s+the|\(To\s+the)\s+'
    r'(?:first(?:\s+\(or\s+lowest\))?|second|third|fourth|fifth|sixth(?:\s+\(or\s+topmost\))?|topmost)\s+line\b'
    r'|(?<![1-7Iibr>,L.,\'\-* ])'
    r'(?:In\s+the|The|From\s+the|\(To\s+the)\s+'
    r'(?:first(?:\s+\(or\s+lowest\))?|second|third|fourth|fifth|sixth(?:\s+\(or\s+topmost\))?|topmost)\s+line\b'
    r'|7\.\s*\(The\s+lines\s+of\s+this\s+hexagram\b'
    r')'
)


def format_hex_text_paras(paras, hex_no):
    out = []
    for p in paras:
        p = polish(p)
        if not p:
            continue
        if re.match(r'^Explanation\s+of\s+the\s+entire\s+figure\b', p, re.I):
            out.append('_Explanation of the entire figure by king Wan._')
            continue
        if re.match(r'^Explanation\s+of\s+the\s+separate\s+lines\b', p, re.I):
            out.append('_Explanation of the separate lines by the duke of Chou._')
            continue
        starts = [m.start() for m in _DUKE_LINE_SPLIT_RX.finditer(p)]
        chunks = []
        if starts:
            if starts[0] > 0:
                chunks.append(p[:starts[0]].strip())
            for idx_s, st in enumerate(starts):
                en = starts[idx_s + 1] if idx_s + 1 < len(starts) else len(p)
                chunks.append(p[st:en].strip())
        else:
            chunks = [p]

        for ch in chunks:
            if not ch:
                continue
            m_ord = re.match(
                r'^(?:[1-7Iibr>]{1,2}[.,\'\-* ]{0,4}|,L\s*)?'
                r'((?:In\s+the|The|From\s+the|\(To\s+the)\s+'
                r'(first|second|third|fourth|fifth|sixth|topmost)\b.*)$',
                ch,
            )
            if m_ord:
                num = _ORD_WORD_TO_NUM[m_ord.group(2)]
                out.append(f'{num}. {m_ord.group(1)}')
            elif re.match(r'^7\.\s*\(The\s+lines\b', ch):
                out.append(ch)
            else:
                out.append(ch)
    return out


def build_the_text():
    rbs = raw_blocks(i_text, i_app, in_intro=False)
    text_by_hex = {n: [] for n in range(1, 65)}
    notes_by_hex = {n: [] for n in range(1, 65)}

    cur_h = 1
    mode = 'TEXT'
    for idxs, had_page_turn in rbs:
        if idxs[0] in HX_SET:
            cur_h = HX_SET[idxs[0]]
            mode = 'TEXT'
            continue
        if had_page_turn:
            # Top of a new printed page in SBE starts with Translation unless the block itself is wide/note
            mode = 'TEXT'
        cnt, avg, mx, s0 = block_metrics(idxs)
        if not s0:
            continue
        if re.match(r'^Explanation\s+of\s+the\s+', s0):
            mode = 'TEXT'
        elif idxs[0] in NOTE_STARTS.values():
            mode = 'NOTE'
        elif cnt >= 2:
            mode = 'NOTE' if (avg >= 56.0 or mx >= 60) else 'TEXT'
        else:
            if len(s0) >= 58 or re.match(r'^(?:Line\s+[1-6]\s+is\b|Paragraph\s+[1-7]\b|See\s+(?:the\s+note|on\s+)|Compare\s+)', s0):
                mode = 'NOTE'
            elif re.match(r'^[1-7Iib>,L][.,\'\-* ]{0,3}(?:In\s+the|The\s+|From\s+the|\(To\s+the)', s0):
                mode = 'TEXT'

        txt, sh = join_raw_lines(idxs)
        if not txt:
            continue
        if mode == 'TEXT':
            text_by_hex[cur_h].append((txt, sh))
        else:
            owner = note_owner_hex(idxs[0])
            notes_by_hex[owner].append((txt, sh))

    md_lines = ['## The Text', '', '### Section I', '']
    for n in range(1, 65):
        h = HEX[n - 1]
        md_lines.append(f"### {roman_num(n)}. {h['name']} {h['chinese']} \u2014 {h['english']}")
        md_lines.append('')
        t_paras = format_hex_text_paras(rejoin_stream(text_by_hex[n]), n)
        n_paras = [polish(p) for p in rejoin_stream(notes_by_hex[n]) if polish(p)]
        if n == 14 and n_paras and n_paras[0].startswith('a state of opulence'):
            n_paras[0] = 'XIV. ' + n_paras[0]
        elif n == 22 and n_paras and 'Symbo1' in n_paras[0]:
            n_paras[0] = 'XXII. ' + n_paras[0]
        elif n == 53 and n_paras:
            n_paras[0] = re.sub(r'^;\s*', '', n_paras[0])
        for p in t_paras:
            md_lines.append(p)
            md_lines.append('')
        if n_paras:
            for p in n_paras:
                md_lines.append(p)
                md_lines.append('')
        if n == 30:
            md_lines.append('### Section II')
            md_lines.append('')
    return md_lines


# ------------------------------------------------------------------ THE APPENDIXES (I–VII)
APP_TITLES = {
    'I': "Treatise on the Thwan, or king Wan's Explanations of the entire Hexagrams.",
    'II': "Treatise on the Symbolism of the Hexagrams, and of the duke of Chou's Explanations of the several Lines.",
    'III': "The Great Appendix.",
    'IV': "Supplementary to the Thwan and Yao on the first and second Hexagrams, and showing how they may be interpreted of man's nature and doings.",
    'V': "Treatise of Remarks on the Trigrams.",
    'VI': "The Orderly Sequence of the Hexagrams.",
    'VII': "Treatise on the Hexagrams taken promiscuously, according to the opposition or diversity of their meaning.",
}

_APP_TITLECARD_RX = re.compile(
    r'^(?:Treatise\s+on\s+the\s+(?:Thv?wan|Symbolism)|'
    r'Treatise\s+of\s+Remarks\s+on\s+the\s+Trigrams\.?$|'
    r'The\s+Great\s+Appendix\.\s*Section\s+I\.?$|'
    r'Supplementary\s+to\s+the\s+T\s*Invan|'
    r'The\s+Orderly\s+Sequence\s+of\s+the\s+Hexagrams\.?$|'
    r'Treatise\s+on\s+the\s+Hexagrams\s+taken\s+promiscuously|'
    r'Section\s+(?:I|II)\b[.,]?\s*(?:Kmm|K\s*h\s*wan)?\.?$)',
    re.I,
)


def build_appendix_treatise(secs):
    """Build all sections of one Appendix treatise together so a page-bottom
    commentary paragraph crossing the Section I -> Section II page break
    rejoins seamlessly onto Section I's note before the Section II heading."""
    units = []          # list of ('SEC', heading_str) or ('U', uid)
    text_by_unit = collections.defaultdict(list)
    notes_stream = []   # [txt, sh, uid]
    cur_uid = 0

    for sec in secs:
        sec_head, start, end = sec[0], sec[1], sec[2]
        notes_only = sec[3] if len(sec) > 3 else False
        if sec_head:
            units.append(('SEC', sec_head))
        cur_uid += 1
        units.append(('U', cur_uid))

        rbs = raw_blocks(start, end, in_intro=False)
        if notes_only:
            for idxs, _ in rbs:
                txt, sh = join_raw_lines(idxs)
                if txt and not _APP_TITLECARD_RX.match(txt):
                    notes_stream.append([txt, sh, cur_uid])
            continue

        mode = 'TEXT'
        for idx_b, (idxs, had_page_turn) in enumerate(rbs):
            cnt, avg, mx, s0 = block_metrics(idxs)
            if not s0:
                continue
            if idx_b < 4 and _APP_TITLECARD_RX.match(s0):
                continue
            if had_page_turn:
                mode = 'TEXT'

            if re.match(r'^Chapter\s+[IVX0-9]+\.\s+\d', s0):
                mode = 'TEXT'
            elif cnt >= 2:
                mode = 'NOTE' if (avg >= 56.5 or mx >= 60) else 'TEXT'
            else:
                if len(s0) >= 58 or re.match(
                    r'^(?:Paragraphs?\s+\d|Chapter\s+[IVX0-9]+[.,]\s+(?!\d)|For\s+line\s+\d|See\s+(?:on\s+the|note\s+on)|Compare\s+paragraph)',
                    s0,
                ):
                    mode = 'NOTE'
                elif re.match(r'^(?:[IVXL]{1,8}\.\s+(?:1\.|i\.|\(|Heaven|Earth)|[1-7]\.\s+[‘\'"(])', s0):
                    mode = 'TEXT'

            txt, sh = join_raw_lines(idxs)
            if not txt or _APP_TITLECARD_RX.match(txt):
                continue

            if mode == 'TEXT':
                if re.match(r'^(?:Chapter\s+[IVX0-9]+\.|[IVXL]{1,8}\.\s+)', txt):
                    cur_uid += 1
                    units.append(('U', cur_uid))
                text_by_unit[cur_uid].append((txt, sh))
            else:
                notes_stream.append([txt, sh, cur_uid])

    rejoined_notes_by_unit = collections.defaultdict(list)
    merged_notes = []
    for txt, sh, uid in notes_stream:
        if not merged_notes:
            merged_notes.append([txt, sh, uid])
            continue
        prev_txt, prev_sh, prev_uid = merged_notes[-1]
        res = rejoin_stream([(prev_txt, prev_sh), (txt, sh)])
        if len(res) == 1:
            merged_notes[-1] = [res[0], sh, prev_uid]
        else:
            merged_notes.append([txt, sh, uid])

    for txt, _, uid in merged_notes:
        p = polish(txt)
        if p:
            rejoined_notes_by_unit[uid].append(p)

    out_md = []
    for kind, val in units:
        if kind == 'SEC':
            out_md += [val, '']
            continue
        t_ps = [polish(p) for p in rejoin_stream(text_by_unit[val]) if polish(p)]
        for p in t_ps:
            p = re.sub(r'^(Chapter\s+[IVX0-9]+\.)\s+', r'**\1** ', p)
            out_md += [p, '']
        for p in rejoined_notes_by_unit.get(val, ()):
            out_md += [p, '']
    return out_md


def build_appendix_vii():
    note_blocks = raw_blocks(24086, 24093)
    note_txt = polish(' '.join(join_raw_lines(b)[0] for b, _ in note_blocks))
    out = [note_txt]

    raw_v = []
    for i in range(24093, i_translit):
        s = ' '.join(raw[i].split())
        if not s:
            raw_v.append('')
            continue
        if re.fullmatch(r'(?:THE\s+)?APPENDIX(?:ES|\s+VII)[.,]?|44\d|;\|y\s*\}', s, re.I):
            continue
        s = re.sub(r'^(?:j\s*,\s*|pi\s+|I:\s*|1\s+(?=58,)|,\s+(?=17,))', '', s)
        s = re.sub(r'^(?:Jj\]|ij1|!\|\||If)\s+(?=[a-z])', '', s)
        s = re.sub(r'^I\s+(?=Takes\s+what\s+is\s+plain)', '', s)
        s = re.sub(r',\s*t$', '.', s)
        s = re.sub(r'^i,\s*2\.', '1, 2.', s)
        s = s.replace('15, i(5.', '15, 16.').replace('34, 33*', '34, 33.')
        raw_v.append(s)

    verse_lines = []
    prev_sh = False
    for s in raw_v:
        if not s:
            continue
        had_sh = s.endswith(SOFT)
        s_clean = s.replace(SOFT, '').strip()
        is_numbered = bool(re.match(r'^\d{1,2}(?:\s*[,;]\s*\d{1,2})?[.,:]\s+', s_clean))
        is_cap_verse = bool(re.match(r'^(?:Their\s+different|Takes\s+what|Are\s+met|To\s+move|Prospers\s+the)\b', s_clean))

        if prev_sh and verse_lines:
            verse_lines[-1] = verse_lines[-1] + s_clean
        elif s_clean == 'PI' and verse_lines:
            verse_lines[-1] = verse_lines[-1] + ' Pi'
        elif not is_numbered and not is_cap_verse and verse_lines:
            verse_lines[-1] = verse_lines[-1] + ' ' + s_clean
        else:
            verse_lines.append(s_clean)
        prev_sh = had_sh

    # Group into printed rhyme stanzas (couplets, plus the 3 rhyming triplets at 35/36/48, 31/32/59, 5/6/28)
    triplet_third_rx = re.compile(r'^(?:48,\s*47\.|59,\s*60\.|28\.)')
    stanzas = []
    cur = []
    for idx_v, vl in enumerate(verse_lines):
        vl = polish(vl)
        cur.append(vl)
        nxt_vl = verse_lines[idx_v + 1] if idx_v + 1 < len(verse_lines) else ''
        if len(cur) >= 2 and vl[-1] in '.:;-' and not triplet_third_rx.match(nxt_vl):
            stanzas.append(cur)
            cur = []
    if cur:
        if stanzas:
            stanzas[-1].extend(cur)
        else:
            stanzas.append(cur)

    for st in stanzas:
        out.append('  \n'.join(st))
    return out


# ------------------------------------------------------------------ Assemble Markdown
out_lines = [
    '# The Yi King',
    '',
    '*The Text of the Yi King* and *The Appendixes*, translated from the Chinese by **James Legge**, D.C.L. '
    'Professor of Chinese in the University of Oxford (The Sacred Books of the East, Vol. XVI, 1882), '
    'with the *Preface* and *Introduction* by the translator.',
    '',
    '> This edition was cleansed from a scanner\u2019s OCR text file of the Dover Publications reprint '
    '(first published 1950, this reproduction 1963). Publisher advertising, the publisher\u2019s catalogue, '
    'running heads, folio numbers and scanning debris have been removed; two-band pages (translation and '
    'notes) have been separated so commentary never splices mid-sentence; lines of prose broken by page '
    'turns and soft hyphens have been joined; and the structure of the book has been rebuilt as markdown. '
    'Hexagram chapter headings carry the transliterated names from this project\u2019s canonical '
    '[legge-1882.json](./legge-1882.json); the prose itself preserves the book\u2019s own spellings, '
    'scan damage and all, except where repaired from the book\u2019s internal evidence. '
    'See [PROVENANCE.md](./PROVENANCE.md) for details and known limitations.',
    '',
    '## Contents',
    '',
    '### Introduction',
    '',
    'The book\u2019s Introduction runs to three chapters and opens at page 1:',
    '',
    '| Ch. | Chapter | Page |',
    '|---|---|---|',
    '| 1 | The Yi King from the Twelfth Century B.C. to the Commencement of the Christian Era | 1 |',
    '| 2 | The Subject-matter of the Text. The Lineal Figures and the Explanation of them | 9 |',
    '| 3 | The Appendixes | 26 |',
    '',
    '### The Text \u2014 Judgement and the Line',
    '',
    '*The sixty-four hexagram groups, in order. (The printed table\u2019s page-number column did not survive scanning and is not reproduced here.)*',
    '',
    '| No. | Hexagram |',
    '|---|---|',
]
for _h in HEX:
    out_lines.append(f"| {_h['number']} | **{_h['chinese'] or ''}** {_h['name']} \u2014 *{_h['english']}* |")

out_lines += [
    '',
    '### The Appendixes',
    '',
    '*The seven Great Commentary treatises, with the page ranges printed in this volume\u2019s contents table.*',
    '',
    '| No. | Treatise | Pages |',
    '|---|---|---|',
    '| 1 | Treatise on the Thwan, that is, on king Wan\u2019s Explanations of the entire Hexagrams | 213\u2013266 |',
    '| 2 | Treatise on the Symbolism of the Hexagrams, and of the duke of Chow\u2019s Explanations of the several Lines | 267\u2013347 |',
    '| 3 | The Great Appendix | 348\u2013407 |',
    '| 4 | Supplementary to the Thwan and Yao on the first and second Hexagrams, and showing how they may be interpreted of Man\u2019s Nature | 408\u2013421 |',
    '| 5 | Treatise of Remarks on the Trigrams | 422\u2013432 |',
    '| 6 | The Orderly Sequence of the Hexagrams | 433\u2013440 |',
    '| 7 | Treatise on the Hexagrams taken promiscuously, according to the opposition or diversity of their meaning | 441\u2013444 |',
    '| \u2014 | *Transliteration of Oriental Alphabets adopted for the translations of the Sacred Books of the East* | 445 |',
    '',
    '> *The tables of contents above reproduce the printed contents of the volume; page numbers are the volume\u2019s own.*',
    '',
]

i_pre_end = 853
pre_paras = build_prose_with_footnotes(i_pre + 1, i_pre_end, in_intro=False)
out_lines += ['## Preface', '']
for _p in pre_paras:
    _p = re.sub(r'^Oxford,\s*1\s*6th\s+March', 'Oxford, 16th March', _p)
    out_lines += [_p, '']

CHTT = {
    1: 'The Yi King from the Twelfth Century B.C. to the Commencement of the Christian Era',
    2: 'The Subject-matter of the Text. The Lineal Figures and the Explanation of them',
    3: 'The Appendixes',
}
intro_raw_paras = build_prose_with_footnotes(i_intro + 1, i_text, in_intro=True)
out_lines += ['## Introduction', '']
_skip_next = False
for _idx_p, _p in enumerate(intro_raw_paras):
    if _skip_next:
        _skip_next = False
        continue
    _mc = re.match(r'^Chapter\s+(I{1,3}|\d)[.,]?\s*(.*)$', _p, re.I)
    if _mc:
        _cnum = int(_mc.group(1)) if _mc.group(1).isdigit() else roman_val(_mc.group(1).upper())
        _rest = _mc.group(2).strip()
        if _idx_p + 1 < len(intro_raw_paras):
            _nxt = intro_raw_paras[_idx_p + 1]
            if _cnum in CHTT and _nxt.lower().startswith(CHTT[_cnum][:20].lower()):
                _m_sub = re.match(r'^(.*?Era\.?|.*?them\.?|The\s+Appendixes\.?)\s*(?:([i1I][.,])\s+(.*))?$', _nxt, re.I)
                if _m_sub:
                    _skip_next = True
                    out_lines += [f"### Chapter {roman_num(_cnum)}. {CHTT[_cnum]}", '']
                    if _m_sub.group(3):
                        out_lines += ['1. ' + _m_sub.group(3).strip(), '']
                    continue
        out_lines += [f"### Chapter {roman_num(_cnum)}. {CHTT.get(_cnum, _rest)}", '']
        if _rest and _cnum in CHTT and not _rest.lower().startswith(CHTT[_cnum][:18].lower()):
            out_lines += [_rest, '']
        continue
    _p = re.sub(r'^i\.\s+(?=[A-Z])', '1. ', _p)
    out_lines += [_p, '']

out_lines += ['---', '']
out_lines += build_the_text()
out_lines += ['---', '']
out_lines += ['## The Appendixes', '']

APP_SECTIONS = [
    ('I', [
        ('#### Appendix I \u00b7 Section I', 12199, 13521),
        ('#### Appendix I \u00b7 Section II', 13521, i_a2),
    ]),
    ('II', [
        ('#### Appendix II \u00b7 Section I', 15013, 17070),
        ('#### Appendix II \u00b7 Section II', 17070, i_a3),
    ]),
    ('III', [
        ('#### Appendix III \u00b7 Section I', 19436, 21033),
        ('#### Appendix III \u00b7 Section II', 21033, i_a4),
    ]),
    ('IV', [
        ('#### Appendix IV \u00b7 Section I \u2014 Khien', 22511, 23020),
        ('#### Appendix IV \u00b7 Section II \u2014 Khwan', 23020, i_a5),
    ]),
    ('V', [
        (None, 23213, i_a6),
    ]),
    ('VI', [
        ('#### Appendix VI \u00b7 Section I', 23750, 23852, False),
        ('#### Appendix VI \u00b7 Section II', 23852, 24008, False),
        ('#### Notes on Appendix VI', 24008, i_a7, True),
    ]),
]

for _num, _secs in APP_SECTIONS:
    out_lines += [f"### Appendix {_num} \u2014 {APP_TITLES[_num]}", '']
    out_lines += build_appendix_treatise(_secs)

out_lines += [f"### Appendix VII \u2014 {APP_TITLES['VII']}", '']
for _p in build_appendix_vii():
    out_lines += [_p, '']

final_text = re.sub(r'\n{3,}', '\n\n', '\n'.join(out_lines)).strip() + '\n'
open(OUT, 'w', encoding='utf-8').write(final_text)
print('bytes', len(final_text), 'lines', final_text.count('\n'))

