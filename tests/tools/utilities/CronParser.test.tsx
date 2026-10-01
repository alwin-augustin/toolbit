import { describe,it,expect } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import CronParser from '@/v2/tools/CronParserV2';
describe('Production cron component',()=>{
    it.each(['* * * * *','0 12 * * *','0 0 * * *'])('parses %s live',expression=>{render(<CronParser/>);const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:expression}});expect(screen.getByText('Next 5 runs')).toBeInTheDocument();});
    it('reports invalid cron expressions',()=>{render(<CronParser/>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'invalid cron'}});expect(screen.getByText(/✕ invalid/)).toBeInTheDocument();});
});
