const request = require('request');
const _ = require('lodash');
const got = require('got');

const transform_flag_name = flag_name => {
    flag_name = _.snakeCase(flag_name);
    if (flag_name.match(/^[0-9]/)) {
        flag_name = 'flag_' + flag_name
    }
    return flag_name
}

const getLDConfiguration = (LD_API_KEY) => {
    const API_URL = 'https://app.launchdarkly.com/api/v2/flags/default'

    const options = {
        method: 'GET',
        headers: {
            'Authorization': LD_API_KEY,
        }
    };

    return got(API_URL, options).
        then((response) => {
            const flags = JSON.parse(response.body)

            const full_mapping = flags.items.map(flag => {
                let key = flag.key
                let status = flag.environments.production.on
                let off_variation = flag.environments.production.offVariation

                return flag.environments.production.prerequisites.map(prereq => ({
                    key: transform_flag_name(key),
                    status,
                    off_variation,
                    depends_on: {
                        key: transform_flag_name(prereq.key),
                        variation: prereq.variation
                    },
                    variations: flag.variations
                }))
            })

            const flat_mapping = _.flatten(_.reject(full_mapping, _.isEmpty))
            const flags_with_prereqs = _.uniq(_.flatten(flat_mapping.map(flag => ([flag.key, flag.depends_on.key]))))

            let create_label_for_flag = {}
            _.reject(flags_with_prereqs, _.isEmpty).forEach(f => {
                create_label_for_flag[f] = true
            })

            let flag_items_with_prereqs = flags.items.filter(flag => create_label_for_flag[transform_flag_name(flag.key)])
            flag_items_with_prereqs = flag_items_with_prereqs.map(f => ({
                ...f,
                key: transform_flag_name(f.key),
            }))

            return { flag_items_with_prereqs, flat_mapping };
        }, (error) => {
            throw error;
        })
};

module.exports = {
    getLDConfiguration,
    transform_flag_name,
}
