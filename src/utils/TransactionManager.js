
export class TransactionManager {
  constructor(database) {
    this.database = database;
  }

  /**
   * @param {(connection) => Promise<any>} work 
   *   
   */

  async run(work) {
    const connection = await this.database.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Fallo adicional al ejecutar ROLLBACK:', rollbackError.message);
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}
