import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

//Libreria Propia
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { Item } from './entities/item.entity';
import { MESSAGE } from './../../config/messages';
import { User } from '../users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
  ) {}

  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    try {
      const newItem = this.itemRepo.create({ ...createItemInput, user: user });
      return await this.itemRepo.save(newItem);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  //select * from Items where user_id = '1221343442' => Este seria el Query
  async findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<Item[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.itemRepo
      .createQueryBuilder()
      .take(limit)
      .offset(offset)
      .where(`"user_id" = :userId`, { userId: user.id });

    if (search) {
      queryBuilder.andWhere('LOWER(name) like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    }

    return queryBuilder.getMany();

    //? Esta es una forma de como hacerlo
    // return await this.itemRepo.find({
    //   take: limit, // Limit
    //   skip: offset, // Skip
    //   where: {
    //     user: {
    //       id: user.id, //Esto significa que el user_id debe ser igual
    //     },
    //     name: Like(`%${search}%`), /// seelct * from where name like '%termi%' // COn esto busco terminos que tenga este parecido
    //   },
    // });
  }

  async findOne(id: string, user: User): Promise<Item> {
    //const item = await this.itemRepo.findOne({
    //  where: { id: id },
    //  relations: {
    //    user: true,
    //  },
    //});
    //if (!item) {
    //  throw new NotFoundException(MESSAGE.NO_SE_ENCONTRO_ESTE_ITEM);
    //}
    //if (item.user.id != user.id) {
    //  throw new NotFoundException(MESSAGE.NO_SE_ENCONTRO_ESTE_ITEM);
    //}
    const item = await this.itemRepo.findOneBy({
      id,
      user: {
        id: user.id,
      },
    });
    if (!item) {
      throw new NotFoundException(MESSAGE.NO_SE_ENCONTRO_ESTE_ITEM);
    }
    //item.user = user;
    return item;
  }

  async findOneById(id: string): Promise<Item> {
    const item = await this.itemRepo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(MESSAGE.NO_SE_ENCONTRO_ESTE_ITEM);
    }
    return item;
  }

  //TODO: bloquear que puedan modificar el id de usuario
  async update(
    id: string,
    updateItemInput: UpdateItemInput,
    user: User,
  ): Promise<Item> {
    await this.findOne(id, user);
    const item = await this.itemRepo.preload(updateItemInput);
    return await this.itemRepo.save(item);
  }

  async remove(id: string, user: User): Promise<Item> {
    // TODO: soft delete, integridad referencial
    const item = await this.findOne(id, user);
    await this.itemRepo.remove(item);
    return { ...item, id };
  }

  async itemCountByUser(user: User): Promise<number> {
    return await this.itemRepo.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }
}
