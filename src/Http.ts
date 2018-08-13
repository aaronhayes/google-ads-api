import request from 'request'
import { snakeCase, isObject } from 'lodash'

import { getAccessToken } from './token'
import { ADWORDS_API_BASE_URL } from "./constants"

import { Client } from './types/Global'
import { RequestOptions, HttpController } from './types/Http'
import { ListConfig, EntityUpdateConfig, NewEntityConfig } from './types/Entity'


export default class Http implements HttpController {
    private client : Client

    constructor({cid, refresh_token, client_id, developer_token, client_secret} : Client) {
        this.client = {
            cid,
            refresh_token,
            client_id,
            developer_token,
            client_secret
        }
    }

    /* 
    *   PUBLIC 
    */
    public async create(config: NewEntityConfig, entity: string) {
        const url = this.getRequestUrl('mutate', entity)
        const options = await this.getRequestOptions('POST', url)

        config = this.formatRequestConfig(config, entity)
        const create_operation = { create: config }
        options.body = JSON.stringify({ operations: [ create_operation ] }) 

        return this.queryApi(options).then(response => {
            return this.mapResultsWithIds(response)
        })
    }

    public async retrieve(entity: string, entity_id?: string) {
        const url = this.getRequestUrl('get', entity, entity_id)
        const options = await this.getRequestOptions('GET', url)

        return this.queryApi(options)
    }

    public async list(config: ListConfig, resource: string) {
        const url = this.getRequestUrl('search')
        const query = this.buildQuery(config, resource)
        const options = await this.getRequestOptions('POST', url)
        options.qs = { query }

        return this.queryApi(options)
    }

    public async update(config: EntityUpdateConfig, entity: string) {
        const url = this.getRequestUrl('mutate', entity)
        const options = await this.getRequestOptions('POST', url)
        
        const update_operation = {
            update: config.update,
            update_mask: this.getUpdateMask(config.update)
        }
        update_operation.update.resource_name = this.buildResourceName(entity, config.id)
        options.body = JSON.stringify({ operations: [ update_operation ] }) 
        
        return this.queryApi(options).then(response => {
            return this.mapResultsWithIds(response)
        })
    }

    public async delete(entity: string, entity_id: string) {
        const url = this.getRequestUrl('mutate', entity)
        const options = await this.getRequestOptions('POST', url)

        const update_operation = {
            remove: this.buildResourceName(entity, entity_id)
        }
        options.body = JSON.stringify({ operations: [ update_operation ] }) 

        return this.queryApi(options)
    }

    public async search(query: string) {
        const url = this.getRequestUrl()
        const options = await this.getRequestOptions('POST', url)

        query = query.replace(/\s/g,' ')
        options.qs = { query }

        return this.queryApi(options)
    }


    /* 
    *   PRIVATE
    */
    private queryApi(options: (request.UriOptions & request.CoreOptions) | (request.UrlOptions & request.CoreOptions)) {
        const _this = this
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) {
                    reject(error)
                } else if (body.includes('Error 404')){
                    reject(body)
                } else {
                    const entity_body = JSON.parse(body)
                    const final_object = _this.transformObjectKeys(entity_body)

                    if(final_object.error){
                        reject(final_object.error)
                    } else {
                        resolve(final_object)
                    }
                }   
            })
        })
    }

    private async getRequestOptions(method: string, url: string) : Promise<RequestOptions> {
        const access_token = await getAccessToken(this.client)

        const options = <RequestOptions>{
            method,
            url,
            headers: {
                authorization: `Bearer ${access_token}`,
                'developer-token': this.client.developer_token
            }
        }
        return options
    }

    private formatRequestConfig(config: any, entity: string) {
        let final_config = <any>{}

        if (entity.includes('campaigns')){
            final_config.campaign_budget = `customers/${this.client.cid}/campaignBudgets/${config.budget_id}`
            final_config.name = config.name
            final_config.target_spend = config.target_spend
        } else if (entity.includes('campaignBudgets')){
            final_config = config
        } else if (entity.includes('adGroups')){
            final_config.name = config.name
            final_config.campaign = `customers/${this.client.cid}/campaigns/${config.campaign_id}`
        } else if (entity.includes('adGroupAds')){
            final_config.ad_group = `customers/${this.client.cid}/adGroups/${config.ad_group_id}`
            final_config.ad = config.ad
        } else if (entity.includes('adGroupCriteria')){
            final_config.ad_group = `customers/${this.client.cid}/adGroups/${config.ad_group_id}`
            if(config.keyword){
                final_config.keyword = config.keyword
            }
        }
        return final_config
    }

    private getRequestUrl(operation_type?: string, endpoint?: string, entity_id?: string) : string {
        if(endpoint && endpoint.includes('customers')) {
            return `${ADWORDS_API_BASE_URL}${this.client.cid}`
        } 
        if(operation_type && operation_type.includes('get')) {
            return `${ADWORDS_API_BASE_URL}${this.client.cid}/${endpoint}/${entity_id}`
        }
        if(operation_type && operation_type.includes('mutate')) {
            return `${ADWORDS_API_BASE_URL}${this.client.cid}/${endpoint}:mutate`
        }
        return `${ADWORDS_API_BASE_URL}${this.client.cid}/googleAds:search`
    }

    private buildResourceName(endpoint?: string, entity_id?: string|number) : string {
        if(entity_id){
            return `customers/${this.client.cid}/${endpoint}/${entity_id}`
        } else {
            return `customers/${this.client.cid}`
        }
    }

    private getUpdateMask(update_object: any) : string {
        let mask = ''
        for(const key in update_object){
            if(isObject(update_object[key])){
                mask += Object.keys(update_object[key]).map(child_key => `${key}.${child_key}`).join(',') 
            } else {
                mask += `${key},`
            }
        }
        return mask
    }

    private buildQuery(config: any, resource: string) : string {
        const selected_fields = config.fields.map((field: string) => `${resource}.${field}`)

        let query = `SELECT ${selected_fields.join(', ')} FROM ${resource}`

        if(config.ad_group_id){
            query += ` WHERE ad_group.id = ${config.ad_group_id}`
        }

        if(config.constraints){
            query += config.ad_group_id ? ' AND ' : ' WHERE '
            let index = 0
            for(const key in config.constraints){
                index += 1
                if(index > 1){
                    query += ' AND '
                }

                if(typeof config.constraints[key] === 'object'){
                    const resource_constraints = config.constraints[key]

                    for(const resource_key in resource_constraints){
                        if(index > 1){
                            query += ' AND '
                        }
                        query += `${key}.${resource_key} = ${resource_constraints[resource_key]}`
                        index += 1
                    }
                    continue
                }

                query += `${resource}.${key} = ${config.constraints[key]}`
            }
        }
        
        if(config.limit && config.limit > 0){
            query += ` LIMIT ${config.limit}`
        }
        // console.log(query)
        return query
    }

    private mapResultsWithIds(response: any) : object {
        const resource_name = response.results[0].resource_name
        const resource_name_split = resource_name.split('/')
        const id = resource_name_split[resource_name_split.length - 1]

        return {
            id,
            resource_name
        }
    }

    private transformObjectKeys(entity_object: any) : any {
        const final: { [key: string]: string|object } = {}

        for(const key in entity_object){
            if(isObject(entity_object[key])){
                final[snakeCase(key)] = this.transformObjectKeys(entity_object[key])
            } else {
                final[snakeCase(key)] = entity_object[key]   
            }
        }

        return final
    }

}