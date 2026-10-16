import {beforeEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({connect:vi.fn(),auth:vi.fn()}));
vi.mock('@/lib/db',()=>({query:vi.fn(),getPool:()=>({connect:mocks.connect})}));
vi.mock('@/lib/auth/session',()=>({requireAuth:mocks.auth,AuthError:class extends Error{}}));
import {POST} from './route';
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({id:7});});
const request=(items:unknown)=>new NextRequest('http://localhost/api/orders',{method:'POST',body:JSON.stringify({items})});
describe('checkout cart validation',()=>{
  it.each([
    [{productId:1,quantity:1},{productId:2,quantity:0}],
    [{productId:1,quantity:.5}], [{productId:1.5,quantity:1}],
    [{productId:1,quantity:2147483648}], [{productId:-1,quantity:1}], [null], [],
  ].map(items=>({items})))('rejects invalid carts before opening a database connection: %j',async({items})=>{
    const response=await POST(request(items));
    expect(response.status).toBe(400);expect(mocks.connect).not.toHaveBeenCalled();
  });
  it('commits a fully valid cart using database prices',async()=>{
    const client={query:vi.fn(async(sql:string)=>{
      if(sql.startsWith('SELECT'))return {rows:[{id:1,price:'10.00'}]};
      if(sql.startsWith('INSERT INTO orders'))return {rows:[{id:42}]};
      return {rows:[]};
    }),release:vi.fn()};
    mocks.connect.mockResolvedValue(client);
    const response=await POST(request([{productId:1,quantity:2}]));
    expect(response.status).toBe(201);
    expect(client.query).toHaveBeenCalledWith('COMMIT');expect(client.release).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orders'),[7,20]);
  });
});
