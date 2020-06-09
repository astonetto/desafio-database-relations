import { getRepository, Repository, In } from 'typeorm';

import AppError from '@shared/errors/AppError';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '@modules/products/infra/typeorm/entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);

    const porductsList = await this.ormRepository.find({ id: In(productsIds) });

    if (productsIds.length !== porductsList.length) {
      throw new AppError('Produtos faltando.');
    }

    return porductsList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);

    const updatedProducts = productsData.map(productData => {
      const findProduct = products.find(
        product => product.id === productData.id,
      );

      if (!findProduct) {
        throw new AppError('Produto não encontrado.');
      }

      if (productData.quantity < findProduct.quantity) {
        throw new AppError('Estoque insuficiente.');
      }

      const newProduct = productData;

      newProduct.quantity -= findProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
