import * as greetings from '../../assets/data/greetings.json';
import * as holidays from '../../assets/data/holidays.json';
import * as defaults from '../../assets/data/defaults.json';
import * as settings from '../../assets/data/bot-settings.json';
import * as questions from '../../assets/data/bot-questions.json';
import { FILE_TYPE } from 'app/default-numbers/default-numbers';

export class ConvertFile {
    constructor() {}

    public ConvertFile(type: number) {
        let file;
        // Set which file to convert
        if (type === FILE_TYPE.Greetings) {
            file = greetings;
        } else if (type === FILE_TYPE.Holidays) {
            file = holidays;
        } else if (type === FILE_TYPE.Defaults) {
            file = defaults;
        } else if (type === FILE_TYPE.Questions) {
            file = questions;
        } else {
            file = settings;
        }

        const data = JSON.parse(JSON.stringify(file));
        let result = [];
        for (const item of data) {
            result.push(item);
        }
        return result;
    }
}
