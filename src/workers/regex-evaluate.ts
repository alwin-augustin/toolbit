export function evaluateRegex(pattern:string,flags:string,text:string,replacement:string,replace:boolean){
    if(pattern.length>2000 || text.length>1000000)throw new Error('Regex input limit exceeded.');
    const re=new RegExp(pattern,flags);const matches=[];let match;
    while((match=re.exec(text))!==null && matches.length<10000){matches.push({fullMatch:match[0],index:match.index,groups:match.slice(1),namedGroups:match.groups||{}});if(!flags.includes('g'))break;if(!match[0].length)re.lastIndex++;}
    return {matches,replaceResult:replace?text.replace(new RegExp(pattern,flags),replacement):''};
}
