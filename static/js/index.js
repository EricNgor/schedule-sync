let app = {};
let init = (app) => {
    app.data = {
        groups: []
    };

    app.enumerate = (a) => {
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };

    app.methods = {

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
        console.log('groups:', app.vue.groups);
    };

    app.init();
}
init(app);