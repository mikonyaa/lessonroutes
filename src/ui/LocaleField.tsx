import {useEffect,useState} from 'react';
export function LocaleField({value,change}:{value:string;change:(value:string)=>void}) {
  const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);
  const valid=/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(draft);
  return <label>Language tag<input value={draft} maxLength={64} aria-invalid={!valid} onChange={e=>{setDraft(e.target.value);if(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(e.target.value))change(e.target.value);}} onBlur={()=>{if(!valid)setDraft(value);}}/>{!valid&&<span className="field-error">Use a tag such as en, ru or en-GB. Invalid text reverts when leaving this field.</span>}</label>;
}
