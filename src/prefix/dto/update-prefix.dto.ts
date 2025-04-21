import { PartialType } from '@nestjs/swagger';
import { CreatePrefixDto } from './create-prefix.dto';

export class UpdatePrefixDto extends PartialType(CreatePrefixDto) {}
