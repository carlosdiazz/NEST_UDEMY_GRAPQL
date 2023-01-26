import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateListsItemInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
