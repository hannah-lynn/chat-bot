import * as moment from 'moment';
import * as _ from 'lodash';
import * as settings from '../../../assets/data/bot-settings.json';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FILE_TYPE, MAX_MESSAGE_LENGTH, MESSAGE_WAIT_TIME, QUESTION_TYPE } from 'app/default-numbers/default-numbers';
import { ConvertFile } from 'app/helpers/convert-files';
import { saveAs } from 'file-saver';

interface HolidayButton {
    country: string;
    city?: string;
    hotel: string;
    rating: number;
    price: number;
    img?: string;
    selected?: boolean;
    onclick?: (btn: HolidayButton) => void;
}

interface ChatButton {
    text?: string;
    selected?: boolean;
    disabled?: boolean;
    onclick?: (btn: ChatButton) => void;
}

interface ChatMessage {
    who?: 'Bot' | 'User' | 'none';
    message?: string;
    buttons?: ChatButton[];
    holidays?: HolidayButton[];
}

@Component({
    animations: [
        trigger('slideInOut', [
            state('in', style({ height: '*', opacity: 0 })),
            transition(':leave', [
                style({ height: '*', opacity: 1 }),

                group([animate(300, style({ height: 0 })), animate('300ms ease-in-out', style({ opacity: '0' }))])
            ]),
            transition(':enter', [
                style({ height: '0', opacity: 0 }),

                group([animate(300, style({ height: '*' })), animate('300ms ease-in-out', style({ opacity: '1' }))])
            ])
        ]),
        trigger('tabAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('300ms', style({ transform: 'translateY(0)', opacity: 1 }))
            ])
        ])
    ],
    encapsulation: ViewEncapsulation.None,
    selector: 'app-synoptic-project',
    styleUrls: ['./app.component.scss'],
    templateUrl: './app.component.pug'
})
export class AppComponent implements OnInit {
    @ViewChild('chatInput', { static: false }) chatInput: ElementRef;

    public showChat: boolean = false;
    public formGroup: FormGroup;
    public bookingFormGroup: FormGroup;
    public message: ChatMessage;
    public button: ChatButton;
    public holiday: HolidayButton;
    public chatOpen: boolean = settings.open;
    public booking: boolean = false;
    public booked: boolean = false;
    public messageHistory: ChatMessage[] = [];
    public userName: string;
    public hotel: string;

    private _holidayType: string;
    private _holidayLocation: string;
    private _budgetAmt: number;
    private _numOfNights: number;
    private _numOfPeople: number;

    private _greetingData: { GreetingReference: number; Greeting: string }[] = [];
    private _questionsArr: { UserKeyword: string; BotResponse: string; ButtonText?: string; Link?: string }[] = [];
    private _defaultResponses: { value: string }[] = [];
    private _holidayData: {
        HolidayReference: number;
        HotelName: string;
        City?: string;
        Continent: string;
        Country: string;
        Category: string;
        StarRating: number;
        TempRating: string;
        Location: string;
        PricePerPerNight: number;
        image: string;
        link: string;
    }[] = [];
    private _holidaysArray: {
        HolidayReference: number;
        HotelName: string;
        City?: string;
        Continent: string;
        Country: string;
        Category: string;
        StarRating: number;
        TempRating: string;
        Location: string;
        PricePerPerNight: number;
        image: string;
        link: string;
    }[] = [];

    constructor(private _builder: FormBuilder, private _data: ConvertFile) {}

    public ngOnInit(): void {
        this._prepareFormGroup();
        this._prepareBookingFormGroup();
        this._greetingData = this._data.ConvertFile(FILE_TYPE.Greetings);
        this._holidayData = this._data.ConvertFile(FILE_TYPE.Holidays);
        this._defaultResponses = this._data.ConvertFile(FILE_TYPE.Defaults);
        this._questionsArr = this._data.ConvertFile(FILE_TYPE.Questions);
    }

    public toggleChat(): void {
        this.showChat = !this.showChat;
        this.booking = false;

        // Clear the chat and variables when opening and closing
        this._clearChat();
        if (this.showChat) {
            setTimeout(() => {
                this.chatInput.nativeElement.focus(), (this.chatInput.nativeElement.disabled = false);
            }, 0);
            return this._startChat();
        }
    }

    public restartChat(): void {
        setTimeout(() => {
            this.chatInput.nativeElement.focus(), (this.chatInput.nativeElement.disabled = false);
        }, 0);
        this.booking = false;
        this._clearChat();
        this._startChat();
    }

    public save() {
        const date = moment().format('L');
        const res = JSON.stringify(this.messageHistory);
        const blob = new Blob([JSON.stringify(res)], {
            type: 'text/plain;charset=utf-8;'
        });
        saveAs(blob, `FH-chat-${date}.txt`);
    }

    public submit(): void {
        const message = this.formGroup.value.chat_input.trim();
        // Clear the input
        this.formGroup.reset();
        if (!this.userName) {
            this._holidayTypeQuestion(message);
        } else if (this._holidayType && !this._numOfPeople) {
            this._holidayLocationQuestion(message);
        } else if (this._numOfPeople && !this._budgetAmt) {
            this._numNightsQuestion(message);
        } else if (this._budgetAmt && !this._numOfNights) {
            const error = this._checkAndSaveNumber(message, QUESTION_TYPE.NumberOfNights);
            if (error) {
                return;
            }
            this._findRecommendedHolidays();
        } else {
            this._sendDefaultResponse(message);
        }
    }

    public book() {
        this.booked = true;
    }

    private _clearChat(): void {
        this.messageHistory = [];
        this.userName = null;
        this._holidayType = null;
        this._holidayLocation = null;
        this._budgetAmt = null;
        this._numOfNights = null;
        this._numOfPeople = null;
    }

    private _restart(): () => void {
        return () => {
            this._clearChat();
            this._startChat();
        };
    }

    private _prepareFormGroup(): void {
        this.formGroup = this._builder.group({
            chat_input: [null, Validators.compose([Validators.maxLength(MAX_MESSAGE_LENGTH)])]
        });
    }

    private _prepareBookingFormGroup(): void {
        this.bookingFormGroup = this._builder.group({
            name: [this.userName ? this.userName : null],
            number_people: [this._numOfPeople ? this._numOfPeople : null],
            hotel: [this.hotel ? this.hotel : null],
            booking_date: [null],
            number_nights: [this._numOfNights ? this._numOfNights : null]
        });
    }

    private _startChat(): void {
        // A random number to choose a random greeting
        const random = Math.floor(Math.random() * this._greetingData.length);
        this._messageWithTimer({ message: this._getDate() }, 400)
            .then(() => {
                return this._messageWithTimer({ who: 'Bot', message: this._greetingData[random].Greeting }, 1000);
            })
            .then(() => {
                return this._messageWithTimer({ who: 'none', message: "What's your name?" }, 1000);
            });
    }

    private _messageWithTimer(message: ChatMessage, timeout?: number): Promise<void> {
        // Push the new message into the messages array
        return new Promise((resolve) => {
            this.messageHistory.push(message);
            setTimeout(() => resolve(), timeout ?? 0);
        });
    }

    private _getDate(): string {
        const date = moment().format('Do MMMM YYYY h:mm a');
        return date;
    }

    private _holidayTypeQuestion(message: string): void {
        this.userName = _.capitalize(message);
        this._messageWithTimer(
            {
                who: 'User',
                message: this.userName.toString()
            },
            400
        ).then(() => {
            const text = ['Active', 'Relaxed'];
            const buttons: ChatButton[] = this._createButtonArray(text, 'holidayType');
            setTimeout(() => (this.chatInput.nativeElement.disabled = true), 0);
            return this._messageWithTimer(
                {
                    who: 'Bot',
                    message: `Welcome to the First Holiday Chat ${this.userName}, what type of holiday do you prefer?`,
                    buttons
                },
                1000
            );
        });
    }

    private _holidayTypeChosen(type: string): () => void {
        // Set the type
        type === 'Relaxed' ? (this._holidayType = 'lazy') : (this._holidayType = 'active');
        return () => {
            setTimeout(() => {
                (this.chatInput.nativeElement.disabled = false), this.chatInput.nativeElement.focus();
            }, 0);
            this._messageWithTimer({ who: 'User', message: type }, MESSAGE_WAIT_TIME).then(() => {
                return this._messageWithTimer({ who: 'Bot', message: 'How many people?' }, MESSAGE_WAIT_TIME);
            });
        };
    }

    private _holidayLocationQuestion(message: string): void {
        const error = this._checkAndSaveNumber(message, QUESTION_TYPE.NumberOfPeople);
        const text = ['City', 'Sea', 'Mountain'];
        const buttons = this._createButtonArray(text, 'location');
        if (error) {
            return;
        }
        setTimeout(() => (this.chatInput.nativeElement.disabled = true), 0);
        this._messageWithTimer(
            {
                who: 'User',
                message
            },
            MESSAGE_WAIT_TIME
        ).then(() => {
            return this._messageWithTimer({ who: 'Bot', message: 'What type of location?', buttons }, MESSAGE_WAIT_TIME);
        });
    }

    private _holidayLocationChosen(location: string): () => void {
        return () => {
            this._holidayLocation = location;
            this._messageWithTimer({ who: 'User', message: this._holidayLocation }, MESSAGE_WAIT_TIME).then(() => {
                setTimeout(() => {
                    (this.chatInput.nativeElement.disabled = false), this.chatInput.nativeElement.focus();
                }, 0);
                return this._messageWithTimer({ who: 'Bot', message: 'What is your budget?' }, MESSAGE_WAIT_TIME);
            });
        };
    }

    private _numNightsQuestion(message: string): void {
        const error = this._checkAndSaveNumber(message, QUESTION_TYPE.Budget);
        // Handle errors with the budget
        if (error) {
            return;
        }
        setTimeout(() => {
            (this.chatInput.nativeElement.disabled = false), this.chatInput.nativeElement.focus();
        }, 0);
        this._messageWithTimer(
            {
                who: 'User',
                message
            },
            MESSAGE_WAIT_TIME
        ).then(() => {
            return this._messageWithTimer(
                {
                    who: 'Bot',
                    message: `Your budget is: £${this._budgetAmt}, how many nights would you like to go for?`
                },
                MESSAGE_WAIT_TIME
            );
        });
    }

    private _checkAndSaveNumber(message: string, type: QUESTION_TYPE): void | boolean {
        // Check if number of nights question to print user response
        if (type === QUESTION_TYPE.NumberOfNights) {
            this._messageWithTimer(
                {
                    who: 'User',
                    message
                },
                MESSAGE_WAIT_TIME
            );
        }
        // Regex to remove currency symbol and commas
        const res = Number(message.replace(/\£|,/g, ''));
        // Checks if is a number otherwise error
        if (isNaN(res)) {
            this._messageWithTimer(
                {
                    who: 'Bot',
                    message: 'Please enter a number only'
                },
                MESSAGE_WAIT_TIME
            );
            return true;
        }
        // Save the data to the correct variable
        if (type === QUESTION_TYPE.Budget) {
            this._budgetAmt = res;
        } else if (type === QUESTION_TYPE.NumberOfNights) {
            this._numOfNights = res;
        } else {
            this._numOfPeople = res;
        }
    }

    private _findRecommendedHolidays(): void {
        const costPerNight = Math.floor(this._budgetAmt / this._numOfNights) / this._numOfPeople;

        // Filter the holidays using the user answers
        this._holidaysArray = _.filter(
            this._holidayData,
            (o) =>
                o.PricePerPerNight <= costPerNight && o.Category === this._holidayType && o.Location === this._holidayLocation.toLowerCase()
        );

        if (!this._holidaysArray.length) {
            const text = ['Start Again'];
            const buttons = this._createButtonArray(text, 'restart');
            this._messageWithTimer(
                { who: 'Bot', message: "Sorry, there aren't any holidays matching your responses", buttons },
                MESSAGE_WAIT_TIME
            );
        } else {
            let holidayButtons: HolidayButton[] = [];
            for (const holiday of this._holidaysArray) {
                let city: string;
                let img: string;
                holiday.City ? (city = holiday.City) : (city = null);
                holiday.image ? (img = `assets/images/holiday-images/${holiday.image}`) : (img = null);
                holidayButtons.push({
                    country: holiday.Country,
                    city,
                    hotel: holiday.HotelName,
                    rating: holiday.StarRating,
                    price: holiday.PricePerPerNight * this._numOfPeople * this._numOfNights,
                    img,
                    onclick: () => {
                        this.hotel = holiday.HotelName;
                        this.booked = false;
                        this.booking = true;
                        this._prepareBookingFormGroup();
                    }
                });
            }
            this._messageWithTimer(
                { who: 'Bot', message: `${this.userName}, your recommended holidays are:`, holidays: holidayButtons },
                MESSAGE_WAIT_TIME
            );
        }
    }

    private _createButtonArray(textArr: string[], type: string): ChatButton[] {
        // Create the button array
        let func: () => void;
        let buttons: ChatButton[] = [];
        for (const text of textArr) {
            // Check which button method we need
            if (type === 'holidayType') {
                func = this._holidayTypeChosen(text);
                buttons.push(this._createButton(text, func, buttons));
            } else if (type === 'location') {
                func = this._holidayLocationChosen(text);
                buttons.push(this._createButton(text, func, buttons));
            } else if (type === 'restart') {
                func = this._restart();
                buttons.push(this._createButton(text, func, buttons));
            }
        }
        return buttons;
    }

    private _createButton(text: string, func: () => void, buttons: ChatButton[]): ChatButton {
        return {
            text: text,
            onclick: (btn) => {
                if (btn.disabled) {
                    return;
                }
                btn.selected = true;
                func();
                // Disable the buttons once clicked
                _.map(buttons, (o) => (o.disabled = true));
            }
        };
    }

    private _sendDefaultResponse(message: string): void {
        // If they don't type the required answer the bot will send them a message from the responses
        for (const question of this._questionsArr) {
            // Split string by punctuation and space
            if (
                message
                    .toLowerCase()
                    .split(/[\s,\?\,\.!]+/)
                    .includes(question.UserKeyword)
            ) {
                let buttons: ChatButton[];
                if (question.ButtonText) {
                    buttons = [
                        {
                            text: question.ButtonText,
                            onclick: (btn) => {
                                if (btn.disabled) {
                                    return;
                                }
                                btn.selected = true;
                                this._defaultButtonLink(question.Link);
                                _.map(buttons, (o) => (o.disabled = true));
                            }
                        }
                    ];
                }
                this._messageWithTimer(
                    {
                        who: 'User',
                        message
                    },
                    MESSAGE_WAIT_TIME
                ).then(() =>
                    this._messageWithTimer(
                        {
                            who: 'Bot',
                            message: `${question.BotResponse}`,
                            buttons
                        },
                        MESSAGE_WAIT_TIME
                    )
                );
                return;
            }
        }
        const random = Math.floor(Math.random() * this._defaultResponses.length);
        this._messageWithTimer(
            {
                who: 'User',
                message
            },
            MESSAGE_WAIT_TIME
        ).then(() =>
            this._messageWithTimer(
                {
                    who: 'Bot',
                    message: `${this._defaultResponses[random].value}`
                },
                MESSAGE_WAIT_TIME
            )
        );
    }

    private _defaultButtonLink(link: string): void {
        // Opens a new tab at the link
        window.open(link, '_Blank');
    }
}
