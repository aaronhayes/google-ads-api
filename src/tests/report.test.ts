import GoogleAdsApi from '..'
import config from '../config'

describe('Reporting', async () => {
    const lib_instance = new GoogleAdsApi({
		client_id: config.client_id, 
		client_secret: config.client_secret, 
		developer_token: config.developer_token
    })

    const customer = lib_instance.Customer({
		customer_account_id: config.cid, 
		refresh_token: config.refresh_token
	})
    
    it('Retrieves API Attributes', async () => {
        // expect.assertions(2)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['id', 'name', 'campaign.id'],
            order_by: 'ad_group.id',
            sort_order: 'DESC'
        })
        // console.log(data)
        expect(data).toBeInstanceOf(Array)
        expect(data[0]).toEqual({
            campaign: {
                resource_name: expect.any(String),
                id: expect.any(Number)
            },
            resource_name: expect.any(String),
            id: expect.any(Number),
            name: expect.any(String),
        })
    })   

    it('Retrieves Metrics', async () => {
        expect.assertions(1)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id', 'campaign.id'],
            metrics: ['metrics.clicks', 'conversions'],
            order_by: 'id',
        })
        expect(data).toBeInstanceOf(Array)
    })    

    it('Converts Micros', async () => {
        expect.assertions(3)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: [
                'ad_group.id', 
                'campaign.id', 
                'campaign.target_cpa.target_cpa_micros',
                'campaign.target_spend.target_spend_micros',
            ],
            metrics: ['metrics.clicks', 'conversions', 'metrics.cost_micros'],
            constraints: ['ad_group.status = ENABLED', 'campaign.target_cpa.target_cpa_micros > 0'],
            order_by: 'id',
            convert_micros: true
        })
        expect(data).toBeInstanceOf(Array)
        expect(data[0].metrics).toEqual({
            clicks: expect.any(Number), 
            conversions: expect.any(Number),
            cost_micros: expect.any(Number),
            cost: expect.any(Number)
        })
        expect(data[0].campaign.target_cpa).toEqual({
            target_cpa_micros: expect.any(Number),  
            target_cpa: expect.any(Number),  
        })
    })   

    it('Retrieves Segments', async () => {
        expect.assertions(2)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id', 'campaign.id'],
            segments: ['device'],
            limit: 10
        })
        expect(data[0]).toEqual({
            campaign: {
                resource_name: expect.any(String),
                id: expect.any(Number)
            },
            device: expect.any(String),
            resource_name: expect.any(String),
            id: expect.any(Number)
        })
        expect(data).toBeInstanceOf(Array)
    })   

    it('Date Constants', async () => {
        expect.assertions(1)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id'],
            metrics: ['clicks', 'conversions'],
            date_constant: 'TODAY'
        })
        // console.log(data);
        expect(data).toBeInstanceOf(Array)
    })    

    it('Custom Date Ranges', async () => {
        expect.assertions(1)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id'],
            metrics: ['clicks', 'conversions'],
            from_date: '2018-09-01',
            to_date: '2018-09-10',
        })
        // console.log(data);
        expect(data).toBeInstanceOf(Array)
    })    

    it('Array of Constraints', async () => {
        expect.assertions(1)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id', 'campaign.id'],
            metrics: ['clicks', 'conversions'],
            constraints: ['ad_group.status = ENABLED'],
            from_date: '2018-09-01',
            to_date: '2018-09-10',
        })
        expect(data).toBeInstanceOf(Array)
    }) 

    it('Single String Constraints', async () => {
        expect.assertions(1)
        const data = await customer.report({
            entity: 'ad_group',
            attributes: ['ad_group.id', 'campaign.id'],
            metrics: ['clicks', 'conversions'],
            constraints: ['ad_group.status = ENABLED', 'campaign.id IN (1485014801, 1483704368)'],
            date_constant: 'TODAY'
        })
        expect(data).toBeInstanceOf(Array)
    })   
})