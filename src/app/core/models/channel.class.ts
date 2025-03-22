export class Channel {
    constructor(
        public id: string = '',
        public name: string = '',
        public description: string = '',
        public userUIDs: string[] = [''],
        public createdByName: string = '',
        public createdById: string = ''
    ) {}   
}