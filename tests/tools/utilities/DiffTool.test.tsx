import { describe,it,expect } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import DiffTool from '@/components/tools/text/DiffTool';
describe('Diff tool routed component',()=>{
    it('shows added and removed text',()=>{render(<DiffTool/>);const inputs=screen.getAllByRole('textbox');fireEvent.change(inputs[0],{target:{value:'Hello World'}});fireEvent.change(inputs[1],{target:{value:'Hello Universe'}});fireEvent.click(screen.getByRole('button',{name:'Compare'}));expect(screen.getAllByText('Hello World').length).toBeGreaterThan(0);expect(screen.getAllByText('Hello Universe').length).toBeGreaterThan(0);});
    it('keeps unchanged lines',()=>{render(<DiffTool/>);const inputs=screen.getAllByRole('textbox');fireEvent.change(inputs[0],{target:{value:'Same line'}});fireEvent.change(inputs[1],{target:{value:'Same line'}});fireEvent.click(screen.getByRole('button',{name:'Compare'}));expect(screen.getAllByText('Same line').length).toBeGreaterThan(0);});
    it('loads sample inputs',()=>{render(<DiffTool/>);fireEvent.click(screen.getByRole('button',{name:/sample/i}));const inputs=screen.getAllByRole('textbox') as HTMLTextAreaElement[];expect(inputs[0].value.length).toBeGreaterThan(0);expect(inputs[1].value.length).toBeGreaterThan(0);expect(inputs[0].value).not.toBe(inputs[1].value);});
});
