import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reaction } from '../../../../core/models/reaction.class';

@Component({
    selector: 'app-reaction-options',
    imports: [],
    templateUrl: './reaction-options.component.html',
    styleUrl: './reaction-options.component.scss'
})
export class ReactionOptionsComponent {
  @Input('reactionOptions') reactionOptions: string[] = [];
  @Output() newReactionEvent = new EventEmitter<string>;

  addNewReaction(reactionName: string) {
    this.newReactionEvent.emit(reactionName);
  }
}
