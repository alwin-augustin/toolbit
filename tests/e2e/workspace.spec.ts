import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async({page})=>{if(process.env.TOOLBIT_BLOCK_ANALYTICS)await page.route(url=>url.hostname==='us.i.posthog.com',route=>route.abort());});
test('home, smart paste, independent documents, settings and recipe',async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await page.evaluate(()=>window.dispatchEvent(new ClipboardEvent('paste',{clipboardData:(()=>{const d=new DataTransfer();d.setData('text','{"b":2,"a":1}');return d;})()})));
    await expect(page).toHaveURL(/json-formatter/);await expect(page.getByRole('textbox',{name:'Input',exact:true})).toContainText('"b":2');
    await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('"b": 2');
    await page.getByTitle('Open another tool').click();
    await expect(page.getByRole('textbox',{name:'Input',exact:true}).locator('.cm-placeholder')).toBeVisible();
    await page.getByRole('textbox',{name:'Input',exact:true}).fill('{"second":true}');
    await page.getByRole('tab',{name:/JSON Formatter 1/}).click();
    await expect(page.getByRole('textbox',{name:'Input',exact:true})).toContainText('"b":2');
    await page.getByTitle('Privacy and storage').click();await page.getByLabel('Product analytics').uncheck();
    await expect(page.getByLabel('Product analytics')).not.toBeChecked();await page.getByLabel('Close settings').click();
    await page.getByRole('button',{name:'Recipes',exact:true}).click();
    await page.getByRole('textbox',{name:'Recipe input',exact:true}).fill('eyJvayI6dHJ1ZX0=');
    await page.getByRole('button',{name:'Run recipe',exact:true}).click();await expect(page.getByRole('dialog',{name:'Recipes'}).getByRole('status')).toContainText('Recipe completed.');
    await page.getByRole('button',{name:'Save recipe',exact:true}).click();await expect(page.getByRole('dialog',{name:'Recipes'}).getByRole('status')).toContainText('Recipe saved locally.');
    await page.getByLabel('Close recipes').click();expect(errors).toEqual([]);
});
test('malformed workspace import reports an actionable error',async({page})=>{
    await page.goto('/json-formatter');await page.getByRole('button',{name:'Workspaces',exact:true}).click();
    await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});
    await expect(page.getByRole('status')).toContainText('valid JSON workspace file');
});
test('home and editor have no serious accessibility violations',async({page})=>{
    for(const route of ['/','/json-formatter']){
        await page.goto(route);await expect(page.getByTitle('Privacy and storage')).toBeVisible();
        const result=await new AxeBuilder({page}).analyze();expect(result.violations.filter(v=>['serious','critical'].includes(v.impact||''))).toEqual([]);
    }
});
test('offline direct navigation reaches cached tools',async({page,context})=>{
    await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await page.reload();await expect(page.getByTitle('Privacy and storage')).toBeVisible();
    await context.setOffline(true);await page.goto('/base64-encoder');
    await expect(page.getByRole('textbox',{name:'Input',exact:true})).toBeVisible();
    await page.getByRole('textbox',{name:'Input',exact:true}).fill('Hello');
    await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('SGVsbG8=');
    await context.setOffline(false);
});
test('storage and clipboard denial leave a working transform and an honest copy state',async({page})=>{
    await page.addInitScript(()=>{
        Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});
        Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Denied','SecurityError');}});
        Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}});
        document.execCommand=()=>false;
    });
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/base64-encoder');await page.getByRole('textbox',{name:'Input',exact:true}).fill('Hello');
    await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('SGVsbG8=');
    await page.getByTitle('Copy').click();await expect(page.getByRole('alert')).toContainText('Copy denied');
    await page.getByTitle('Privacy and storage').click();await page.getByLabel('Product analytics').uncheck();await page.getByLabel('Close settings').click();
    expect(errors).toEqual([]);
});
test('dialogs return focus and narrow views remain usable',async({page})=>{
    await page.setViewportSize({width:390,height:844});await page.goto('/');
    const settings=page.getByTitle('Privacy and storage');await settings.click();await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');await expect(settings).toBeFocused();
    await page.goto('/json-formatter');await page.getByRole('textbox',{name:'Input',exact:true}).fill('{"mobile":true}');await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('"mobile": true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:'test-results/mobile-json.png',fullPage:true});
});
test('explicit workspace data survives refresh and validated restore',async({page})=>{
    await page.goto('/json-formatter');await page.getByRole('textbox',{name:'Input',exact:true}).fill('{"saved":true}');
    await page.getByRole('button',{name:'Workspaces',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Workspaces'});await dialog.getByLabel('Workspace name').fill('Verification workspace');await dialog.getByLabel('Include data in this workspace').check();await dialog.getByRole('button',{name:'Save current'}).click();await expect(dialog.getByRole('status')).toContainText('Workspace saved locally.');
    await dialog.getByTitle('Close',{exact:true}).click();await page.reload();await expect(page.getByRole('textbox',{name:'Input',exact:true}).locator('.cm-placeholder')).toBeVisible();
    await page.getByRole('button',{name:'Workspaces',exact:true}).click();await page.getByRole('dialog',{name:'Workspaces'}).getByRole('button',{name:'Open',exact:true}).click();
    await expect(page.getByRole('textbox',{name:'Input',exact:true})).toContainText('{"saved":true}');await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('"saved": true');
});
test('large input uses a worker and preserves complete clipboard output',async({page,context})=>{
    await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/json-formatter');
    const raw=JSON.stringify({data:'x'.repeat(120*1024)});await page.getByRole('textbox',{name:'Input',exact:true}).evaluate((element,text)=>{const data=new DataTransfer();data.setData('text/plain',text);element.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},raw);
    await expect(page.getByText('Preview shows the first 100 KB. Copy and pipe use the complete output.')).toBeVisible();
    await page.getByTitle('Copy',{exact:true}).click();expect(JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()))).toEqual(JSON.parse(raw));
    await page.getByRole('button',{name:'Clear input',exact:true}).click();await page.getByRole('textbox',{name:'Input',exact:true}).fill('{"new":true}');await expect(page.getByRole('textbox',{name:'Output',exact:true})).toContainText('"new": true');
});
test('worker startup failure produces an error without an unhandled rejection',async({page})=>{
    await page.addInitScript(()=>{window.Worker=class {constructor(){throw new Error('Worker unavailable');}} as unknown as typeof Worker;});
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/json-formatter');await page.getByRole('textbox',{name:'Input',exact:true}).fill(JSON.stringify({data:'x'.repeat(120*1024)}));
    await expect(page.getByText('Invalid input. Previous valid output is retained.')).toBeVisible();expect(errors).toEqual([]);
});
test('privacy and library dialogs pass accessibility checks at 200 percent scale',async({page})=>{
    await page.setViewportSize({width:1280,height:900});await page.goto('/json-formatter');await page.evaluate(()=>{document.documentElement.style.zoom='2';});
    for(const name of ['Privacy and storage','Workspaces','Recipes']){
        if(name==='Privacy and storage')await page.getByTitle(name).click();else await page.getByRole('button',{name,exact:true}).click();
        const result=await new AxeBuilder({page}).analyze();expect(result.violations.filter(v=>['serious','critical'].includes(v.impact||''))).toEqual([]);
        await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    }
});
