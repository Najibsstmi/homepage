import csv, re, json
from collections import defaultdict
from pathlib import Path
root=Path('tmp/bodyparts3d')
parts=defaultdict(set)
with (root/'partof_element_parts.txt').open(encoding='utf-8') as f:
    for row in csv.DictReader(f,delimiter='\t'): parts[row['name']].add(row['element file id'])
entries={
'Skull':['skull'],'VertebralColumn':['vertebral column'],'Sternum':['sternum'],'RibCage':['rib cage'],
}
for side, suffix in [('left','L'),('right','R')]:
    for key, name in [('Clavicle','clavicle'),('Scapula','scapula'),('Humerus','humerus'),('Radius','radius'),('Ulna','ulna'),('HipBone','hip bone'),('Femur','femur'),('Patella','patella'),('Tibia','tibia'),('Fibula','fibula')]: entries[f'{key}_{suffix}']=[f'{side} {name}']
    for key, words in [('Carpals',['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate']),('Tarsals',['talus','calcaneus','cuboid bone','medial cuneiform bone','intermediate cuneiform bone','lateral cuneiform bone'])]:
        entries[f'{key}_{suffix}']=[f'{side} {word}' for word in words]
    entries[f'Tarsals_{suffix}'].append(f'navicular bone of {side} foot')
    for key, term in [('Metacarpals','metacarpal'),('Metatarsals','metatarsal')]: entries[f'{key}_{suffix}']=[n for n in parts if re.match(fr'{side} (first|second|third|fourth|fifth) {term} bone$',n)]
    for key, end in [('HandPhalanges',r'(thumb|index finger|middle finger|ring finger|little finger)'),('FootPhalanges',r'(big toe|second toe|third toe|fourth toe|little toe)')]:
        entries[f'{key}_{suffix}']=[n for n in parts if re.match(fr'(proximal|middle|distal) phalanx of {side} {end}$',n)]
missing=[(k,n) for k,names in entries.items() for n in names if n not in parts]
groups={k:set().union(*(parts[n] for n in names)) for k,names in entries.items()}
groups['RibCage']-=groups['Sternum']
# The source's skull aggregate also includes eyes and two identical hyoid meshes.
# Keep the bone meshes and only one copy of the hyoid pending anatomical review.
groups['Skull']={x for x in groups['Skull'] if int(x.removeprefix('FJ').removesuffix('M')) >= 3199}
seen={}; overlaps=[]
for group, values in groups.items():
 for value in values:
  if value in seen: overlaps.append((value,seen[value],group))
  seen[value]=group
print('missing:',missing,'overlaps:',overlaps)
print('counts:',{k:len(v) for k,v in groups.items()})
print('total unique:',len(seen))
report={'status':'preliminary: not anatomically validated','groups':{k:{'sourceNames':entries[k],'elementIds':sorted(values)} for k,values in groups.items()},'missing':missing,'overlaps':overlaps}
(root/'preliminary-mapping.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
