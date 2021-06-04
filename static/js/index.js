let app = {};

let init = (app) => {
    app.data = {
        group_name: "",
        join_code: "",
        groups: []
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };

    app.load_groups = function () {
        axios.post(load_groups_url,
            {
                group_name: app.vue.group_name,
                join_code: app.vue.join_code,
            }).then(function (response) {
        app.vue.groups.push({
            id: response.data.id,
            group_name: app.vue.group_name,
            join_code: app.vue.join_code,
            });
        app.enumerate(app.vue.groups);
        });
    };

    app.group_url = function(path, id) {
        return `${path}/${id}`
    }

    app.methods = {
        load_groups: app.load_groups,
        group_url: app.group_url
    }

    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods,
    });

    app.init = () => {
        axios.get(load_groups_url).then(function(res) {
            for (let group of res.data.groups) {
                app.vue.groups.push(group.group)
            }
        }).catch((err) => {console.log('Error loading groups:', err)})
    };

    app.init();
}
init(app);