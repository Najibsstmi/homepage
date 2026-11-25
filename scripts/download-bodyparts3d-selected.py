"""Download only mapped ZIP members via HTTP ranges; verify size and CRC32."""
import concurrent.futures, json, struct, urllib.request, zlib
from pathlib import Path

ROOT=Path('tmp/bodyparts3d')
URL='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip'
if not (ROOT/'central.bin').exists():
    request=urllib.request.Request(URL,headers={'Range':'bytes=-65536'})
    with urllib.request.urlopen(request,timeout=90) as response:
        if response.status!=206: raise ValueError('Server did not honour ZIP tail range request')
        tail=response.read()
    end=tail.rfind(b'PK\x05\x06')
    if end<0: raise ValueError('ZIP end record not found')
    fields=struct.unpack_from('<4s4H2LH',tail,end)
    size,offset=fields[5:7]
    request=urllib.request.Request(URL,headers={'Range':f'bytes={offset}-{offset+size-1}'})
    with urllib.request.urlopen(request,timeout=90) as response:
        if response.status!=206: raise ValueError('Server did not honour ZIP directory range request')
        central=response.read()
    if len(central)!=size: raise ValueError('Incomplete ZIP directory')
    (ROOT/'central.bin').write_bytes(central)
data=(ROOT/'central.bin').read_bytes(); index={}; pos=0
while data[pos:pos+4]==b'PK\x01\x02':
    h=struct.unpack_from('<4s6H3L5H2L',data,pos)
    name=data[pos+46:pos+46+h[10]].decode()
    index[Path(name).stem]=(h[16],h[8],h[9],h[7],h[4])
    pos+=46+h[10]+h[11]+h[12]
mapping=json.loads((ROOT/'preliminary-mapping.json').read_text(encoding='utf8'))
ids=sorted({element for group in mapping['groups'].values() for element in group['elementIds']})
out=ROOT/'selected'; out.mkdir(exist_ok=True)
def fetch(element):
    offset,compressed,size,crc,method=index[element]
    dest=out/f'{element}.obj'
    if dest.exists():
        old=dest.read_bytes()
        if len(old)==size and zlib.crc32(old)==crc: return element
    end=offset+30+1024+compressed-1
    request=urllib.request.Request(URL,headers={'Range':f'bytes={offset}-{end}'})
    with urllib.request.urlopen(request,timeout=90) as response:
        if response.status!=206: raise ValueError('Server did not honour range request')
        raw=response.read()
    if raw[:4]!=b'PK\x03\x04': raise ValueError(f'{element}: invalid local ZIP header')
    name_len,extra_len=struct.unpack_from('<HH',raw,26)
    start=30+name_len+extra_len
    payload=raw[start:start+compressed]
    result=zlib.decompress(payload,-15) if method==8 else payload if method==0 else None
    if result is None or len(result)!=size or zlib.crc32(result)!=crc: raise ValueError(f'{element}: ZIP integrity check failed')
    dest.write_bytes(result)
    return element
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    for count,element in enumerate(pool.map(fetch,ids),1):
        if count%20==0 or count==len(ids): print(f'{count}/{len(ids)} verified',flush=True)
